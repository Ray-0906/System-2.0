import { useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/query';
import { useUserStore } from '../store/userStore';
import { useTrackerStore } from '../store/trackerStore';
import { handleTrackerRefresh } from './trackerUtils';

export const  useLoadUser = () => {
  const setUser = useUserStore((s) => s.setUser);
  const setTrackers = useTrackerStore((s) => s.setTrackers);
  const updateTracker = useTrackerStore((s) => s.updateTracker);

  const { data, loading, error } = useQuery(GET_USER, {
    onCompleted: async (data) => {
      if (data?.getUser) {
        setUser(data.getUser);
        setTrackers(data.getUser.trackers);

        for (const tracker of data.getUser.trackers) {
          await handleTrackerRefresh(tracker, updateTracker);
        }
      }
    },
    fetchPolicy: 'network-only'
  });
  console.log('User data loaded:', data?.getUser);
  
  return { loading, error };
};
