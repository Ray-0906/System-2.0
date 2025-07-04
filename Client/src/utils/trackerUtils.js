import { isSameDay, subDays, differenceInCalendarDays } from 'date-fns';
import axiosInstance from './axios';
import { processPenaltyResponse } from './processQuestres';

/**
 * Refreshes a tracker's state if it's outdated, applies penalties, and updates the backend.
 * 
 * @param {Object} tracker - The tracker object from Zustand store
 * @param {Function} updateTrackerInStore - Zustand setter function to update the tracker
 */
export const handleTrackerRefresh = async (tracker, updateTrackerInStore) => {
  const today = new Date();
  
  // Parse lastUpdated and lastCompleted to ensure they are Date objects
  const lastUpdated = tracker.lastUpdated 
    ? new Date(isNaN(tracker.lastUpdated) ? tracker.lastUpdated : Number(tracker.lastUpdated))
    : null;
  const lastCompleted = tracker.lastCompleted 
    ? new Date(isNaN(tracker.lastCompleted) ? tracker.lastCompleted : Number(tracker.lastCompleted))
    : null;

  let delxp=0;

  // Ensure lastUpdated is a valid Date before proceeding
  if (lastUpdated && isNaN(lastUpdated.getTime())) {
    console.error('Invalid lastUpdated date:', tracker.lastUpdated);
    return;
  }

  const isUpdatedToday = lastUpdated ? isSameDay(today, lastUpdated) : false;
  const isCompletedYesterday = lastCompleted ? isSameDay(lastCompleted, subDays(today, 1)) : false;

  // 1. If already updated today, do nothing
  if (isUpdatedToday) {
    console.log('Tracker already updated today');
    return;
  }

  const updatedTracker = { ...tracker };
  let penaltyType = null;

  // 2. Determine penalty
  if (!isCompletedYesterday && lastCompleted) {
    const missedDays = differenceInCalendarDays(today, lastCompleted) - 1;
    
    if (missedDays >= 7) {
      penaltyType = 'missionFail';
      updatedTracker.failed = true;
      delxp=tracker.penalty['missionFail'].stats;
    //notification push for mission failed in queue

    } else if (missedDays > 0) {
      penaltyType = 'skip';
       delxp=tracker.penalty['skip'].stats;
      //notification push for failed to maintain streak in queue
      // streak-00
    }
  } else if (!lastCompleted && !isCompletedYesterday) {
    // Handle case where lastCompleted is null (new tracker)
    penaltyType = 'skip';
  }
 

  // 3. Send update to backend (daily refresh API will handle resetting quests, penalty effects, etc.)
  try {
    const { data } = await axiosInstance.post('/tracker/daily-refresh', {
      trackerId: tracker.id,
      penaltyType,
    });
    console.log('Daily refresh response:', data);
   processPenaltyResponse(data.updatedStats,delxp);
    
    // 4. Update in Zustand store (UI gets fresh state)
    updatedTracker.lastUpdated = today.toISOString(); // Store as ISO string for consistency
    updateTrackerInStore(tracker.id, updatedTracker);
  } catch (err) {
    console.error('Error refreshing tracker:', err);
    // Optional: Handle error state in store/UI if needed
  }
};