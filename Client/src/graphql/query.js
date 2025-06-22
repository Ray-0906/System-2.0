import { gql } from '@apollo/client';

export const GET_USER = gql`
  query {
    getUser {
      username
      level
      coins
      titles
      rank
      xp
      stats {
        strength { value level }
        intelligence { value level}
        agility { value level }
        endurance { value level }
        charisma { value level }
      }
      trackers {
        id
        title
        reward {
          xp
          coins
          specialReward
        }
        penalty {
          missionFail { coins stats }
          skip { coins stats }
        }
        streak
        daycount
        lastUpdated
        lastCompleted
        rank
      }
    }
  }
`;

const GEt_Mission= gql`
  query {
    getPublicMissions {
      id
      title
      description
      duration
      rank
      reward {
        xp
        coins
        specialReward
      }
    }
  }
`;
const GET_TRACKER = gql`
  query GetTrackerById($id: ID!) {
  getTrackerById(id: $id) {
    id
    title
    streak
    daycount
    currentQuests {
      title
      xp
      statAffected
    }
    remainingQuests {
      title
    }
  }
}

`;