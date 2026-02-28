// hooks/useLoadUser.js
import { useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_USER } from '../graphql/query';
import { useUserStore } from '../store/userStore';
import { useTrackerStore } from '../store/trackerStore';
import { handleTrackerRefresh } from './trackerUtils';

export const useLoadUser = () => {
  const setUser = useUserStore((s) => s.setUser);
  const setInitialized = useUserStore((s) => s.setInitialized);
  const fetchVersion = useUserStore((s) => s.fetchVersion);
  const setTrackers = useTrackerStore((s) => s.setTrackers);
  const updateTracker = useTrackerStore((s) => s.updateTracker);

  const [fetchUser, { loading, error, data }] = useLazyQuery(GET_USER, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    const loadUser = async () => {
      // 1. Fast-init from localStorage cache for instant render
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          const cachedUser = JSON.parse(cached);
          setUser(cachedUser);
          setTrackers(cachedUser.trackers || []);
          setInitialized(); // Instant render with cached data
        } catch {
          localStorage.removeItem('user');
        }
      }

      // 2. Background: fetch fresh user data from server
      try {
        const { data } = await fetchUser();
        const user = data?.getUser;
        if (user) {
          setUser(user);
          setTrackers(user.trackers || []);
          localStorage.setItem('user', JSON.stringify(user));

          // 3. Refresh trackers in parallel (not sequentially)
          const trackerPromises = (user.trackers || []).map((tracker) =>
            handleTrackerRefresh(tracker, updateTracker).catch((err) => {
              console.warn('Tracker refresh failed for', tracker.id, err);
            })
          );
          await Promise.allSettled(trackerPromises);
        } else {
          localStorage.removeItem('user');
        }
      } catch (e) {
        // Likely unauthorized; clear any stale data
        localStorage.removeItem('user');
      } finally {
        // Always mark as initialized after network fetch completes
        setInitialized();
      }
    };

    loadUser();
  }, [fetchVersion]);

  return { loading, error };
};
