"""
Event Consumer — Redis Pub/Sub consumer for cross-service event processing.

Subscribes to the 'system2:events' Redis channel.
When Node.js publishes an event notification, this consumer:
  1. Parses the userId
  2. Checks if ≥20 unassigned events exist
  3. If yes → triggers page_builder.build_pages()

Runs in a background thread alongside FastAPI.
If Redis is not configured, the consumer doesn't start (graceful degradation).
"""

import os
import json
import logging
import threading
import time

logger = logging.getLogger("rag.consumer")

CHANNEL = "system2:events"


def _consumer_loop():
    """
    Blocking Redis subscription loop.
    Runs in a daemon thread — stops automatically when the main process exits.
    """
    import redis
    from services.page_builder import build_pages

    redis_url = os.environ.get("REDIS_URL", "")
    if not redis_url:
        logger.warning("REDIS_URL not set — event consumer disabled")
        return

    # Retry connection with backoff
    for attempt in range(5):
        try:
            client = redis.from_url(redis_url, decode_responses=True)
            client.ping()
            logger.info(f"Redis connected, subscribing to '{CHANNEL}'")
            break
        except Exception as e:
            wait = 2 ** attempt
            logger.warning(f"Redis connection attempt {attempt + 1}/5 failed: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    else:
        logger.error("Redis connection failed after 5 attempts — consumer disabled")
        return

    pubsub = client.pubsub()
    pubsub.subscribe(CHANNEL)

    logger.info("Event consumer started — listening for events")

    for message in pubsub.listen():
        if message["type"] != "message":
            continue

        try:
            data = json.loads(message["data"])
            user_id = data.get("userId", "")

            if not user_id:
                logger.warning("Received event without userId, skipping")
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

        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON in Redis message: {message['data']}")
        except Exception as e:
            logger.error(f"Consumer error: {e}")
            # Don't crash — keep listening


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
