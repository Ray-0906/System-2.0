// hooks/useLoadUser.js
import { useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_USER } from '../graphql/query';
import { useUserStore } from '../store/userStore';
import { useTrackerStore } from '../store/trackerStore';
import { handleTrackerRefresh } from './trackerUtils';

export const useLoadUser = () => {
  const setUser = useUserStore((s) => s.setUser);
  const setTrackers = useTrackerStore((s) => s.setTrackers);
  const updateTracker = useTrackerStore((s) => s.updateTracker);

  const [fetchUser, { loading, error, data }] = useLazyQuery(GET_USER, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    const loadUser = async () => {
      const userInLocal = localStorage.getItem('user');
      // if (userInLocal) {
      //   setUser(JSON.parse(userInLocal));
      //   return;
      // }

      const { data } = await fetchUser();
      const user = data?.getUser;
      if (user) {
        setUser(user);
        setTrackers(user.trackers || []);
        for (const tracker of user.trackers || []) {
          await handleTrackerRefresh(tracker, updateTracker);
        }
        localStorage.setItem('user', JSON.stringify(user));
      }
    };

    loadUser();
  }, []);

  return { loading, error };
};
