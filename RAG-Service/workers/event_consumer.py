"""
Event Consumer — Redis Streams consumer for cross-service event processing.

Reads from the 'system2:events:stream' Redis Stream using a consumer group.
When Node.js XADDs an event, this consumer:
  1. Parses the userId
  2. Triggers page_builder.build_pages() (checks ≥20 internally)
  3. Acknowledges the message with XACK

Unlike Pub/Sub, Redis Streams guarantee at-least-once delivery:
  - Messages persist in the stream until acknowledged
  - If this service is offline, messages queue up and are consumed on restart
  - Consumer groups track each consumer's read position

Runs in a background thread alongside FastAPI.
If Redis is not configured, the consumer doesn't start (graceful degradation).
"""

import os
import json
import logging
import threading
import time

logger = logging.getLogger("rag.consumer")

STREAM_KEY = "system2:events:stream"
GROUP_NAME = "rag-service-group"
CONSUMER_NAME = "rag-consumer-1"
BLOCK_MS = 5000  # Block for 5s waiting for new messages


def _consumer_loop():
    """
    Blocking Redis Streams consumer loop.
    Runs in a daemon thread — stops automatically when the main process exits.
    """
    import redis
    from services.page_builder import build_pages

    redis_url = os.environ.get("REDIS_URL", "")
    if not redis_url:
        logger.warning("REDIS_URL not set — event consumer disabled")
        return

    # Retry connection with backoff
    client = None
    for attempt in range(5):
        try:
            client = redis.from_url(redis_url, decode_responses=True)
            client.ping()
            logger.info(f"Redis connected for stream consumer")
            break
        except Exception as e:
            wait = 2 ** attempt
            logger.warning(f"Redis connection attempt {attempt + 1}/5 failed: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    else:
        logger.error("Redis connection failed after 5 attempts — consumer disabled")
        return

    # Ensure consumer group exists (idempotent)
    try:
        client.xgroup_create(STREAM_KEY, GROUP_NAME, id="0", mkstream=True)
        logger.info(f"Created consumer group '{GROUP_NAME}' on stream '{STREAM_KEY}'")
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" in str(e):
            logger.info(f"Consumer group '{GROUP_NAME}' already exists")
        else:
            raise

    logger.info("Event consumer started — listening on Redis Stream")

    while True:
        try:
            # Read new messages ('>') that haven't been delivered to this group
            entries = client.xreadgroup(
                GROUP_NAME,
                CONSUMER_NAME,
                {STREAM_KEY: ">"},
                count=10,
                block=BLOCK_MS,
            )

            if not entries:
                continue

            for stream_name, messages in entries:
                for msg_id, fields in messages:
                    try:
                        raw = fields.get("data", "{}")
                        data = json.loads(raw)
                        user_id = data.get("userId", "")

                        if not user_id:
                            logger.warning(f"Message {msg_id} has no userId, acknowledging and skipping")
                            client.xack(STREAM_KEY, GROUP_NAME, msg_id)
                            continue

                        event_type = data.get("type", "unknown")
                        logger.debug(f"Event received: {event_type} for user {user_id[-6:]}")

                        # Trigger page building (checks ≥20 internally)
                        result = build_pages(user_id)

                        if result["pagesBuilt"] > 0:
                            logger.info(
                                f"Built {result['pagesBuilt']} pages for user {user_id[-6:]} "
                                f"(triggered by {event_type})"
                            )

                        # Acknowledge successful processing
                        client.xack(STREAM_KEY, GROUP_NAME, msg_id)

                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON in stream message {msg_id}, acknowledging to skip")
                        client.xack(STREAM_KEY, GROUP_NAME, msg_id)
                    except Exception as e:
                        logger.error(f"Consumer error processing {msg_id}: {e}")
                        # Don't ack — message will be re-delivered on next read

        except Exception as e:
            logger.error(f"Stream read error: {e}. Reconnecting in 5s...")
            time.sleep(5)


def start_consumer():
    """
    Start the event consumer in a background daemon thread.
    Safe to call at startup — if Redis isn't configured, it's a no-op.
    """
    redis_url = os.environ.get("REDIS_URL", "")
    if not redis_url:
        logger.warning("REDIS_URL not set — event consumer not started")
        return

    thread = threading.Thread(target=_consumer_loop, daemon=True, name="event-consumer")
    thread.start()
    logger.info("Event consumer thread started")
