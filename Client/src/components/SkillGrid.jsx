import SkillCard from "./Skillcard";



const SkillGrid = ({ skills, userStats = {}, unlockedSkills = [], onUnlock }) => {
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {skills.map(skill => (
        <SkillCard
          key={skill.id}
          skill={skill}
          userStats={userStats}
          unlockedSkills={unlockedSkills}
          onUnlock={onUnlock}
        />
      ))}
    </div>
  );
};

export default SkillGrid;
