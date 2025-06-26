import { gql } from "@apollo/client";

export const GET_USER = gql`
  query {
    getUser {
      username
      level
      coins
      titles
      rank
      xp
      totalMission
      completed_trackers{id}
      skills {
        id
        name
        description
        icon
      }
      equiments {
        id
        name
        description
        icon
      }
      stats {
        strength {
          value
          level
        }
        intelligence {
          value
          level
        }
        agility {
          value
          level
        }
        endurance {
          value
          level
        }
        charisma {
          value
          level
        }
      }
      completed_trackers {
      id
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
          missionFail {
            coins
            stats
          }
          skip {
            coins
            stats
          }
        }
        streak
        daycount
        duration
        lastUpdated
        lastCompleted
        rank
      }
    }
  }
`;
const GEt_Mission = gql`
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

export const getAllSkills = gql`
  query {
    getAllSkills {
      id
      name
      description
      rank
      icon
      minLevel
      statRequired {
        stat
        value
      }
    }
  }
`;
const getSkillById = gql`
  query {
    getSkillById(id: "SOME_SKILL_ID_HERE") {
      name
      rank
      statRequired {
        stat
        value
      }
    }
  }
`;

export const GET_ALL_EQUIPMENT = gql`
  query {
    getAllEquipment {
      id
      name
      type
      description
      icon
      cost
      effect
      rarity
      statBonuses {
        strength
        endurance
        intelligence
        agility
      }
    }
  }
`;
const EquipmentById = gql`
  query {
    getEquipmentById(id: "EQUIPMENT_ID_HERE") {
      name
      type
      statBonuses {
        strength
      }
    }
  }
`;
