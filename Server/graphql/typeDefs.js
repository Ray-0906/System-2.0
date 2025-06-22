// graphql/typeDefs.js
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON

  type Stat {
    value: Int
    level: Int
  }

  type Stats {
    strength: Stat
    intelligence: Stat
    agility: Stat
    endurance: Stat
    charisma: Stat
  }

  type Reward {
    xp: Int
    coins: Int
    specialReward: String
  }

  type PenaltyType {
    coins: Int
    stats: Int
  }

  type Penalty {
    missionFail: PenaltyType
    skip: PenaltyType
  }
  type Mission {
  id: ID!
  title: String!
  description: String
   duration: Int
  rank: String
  reward: Reward
  public: Boolean
}


  type Tracker {
  id: ID!
  userId: ID!
  missionId: ID!
  currentQuests: [Quest]
  remainingQuests: [Quest]
  questCompletion: JSON
  streak: Int
  daycount: Int
  lastUpdated: String
  lastCompleted: String
  penaltiesApplied: [String]
  rewardsClaimed: Boolean

  # Flattened mission data
  title: String
  description: String
  duration: Int
  reward: Reward
  penalty: Penalty
  rank: String
}
  type Quest {
  id: ID!
  title: String
  statAffected: String
  xp: Int
}

  type User {
    id: ID!
    username: String
    email: String
    level: Int
    xp: Int
    rank: String
    stats: Stats
    coins: Int
    titles: [String]
    achievements: [String]
    current_missions: [ID]
    trackers: [Tracker]
  }


  type Query {
    getUser: User
    getUserTrackers: [Tracker]
    getPublicMissions: [Mission!]!
     getTrackerById(id: ID!): Tracker
  }
`;
