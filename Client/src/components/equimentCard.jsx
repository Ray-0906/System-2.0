// components/EquipmentCard.jsx
const rarityColors = {
  Legendary: 'from-yellow-600 to-amber-500 border-yellow-400',
  Epic: 'from-purple-700 to-indigo-600 border-purple-400',
  Rare: 'from-blue-600 to-cyan-500 border-blue-400',
  Common: 'from-gray-600 to-slate-500 border-gray-400',
};

export default function EquipmentCard({ equipment }) {
  const rarity = equipment.rarity || 'Common';

  return (
    <div
      className={`w-36 sm:w-40 md:w-44 h-48 rounded-lg border shadow-md bg-gradient-to-br ${rarityColors[rarity]} p-2 flex flex-col justify-between text-white transition-transform hover:scale-105`}
    >
      <div className="text-center font-bold text-sm">{rarity}</div>
      <img src={equipment.icon} alt={equipment.name} className="w-full h-20 object-contain mx-auto" />
      <div className="text-xs text-center mt-2">{equipment.name}</div>
    </div>
  );
}
