import React from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  ListTodo,
  Sparkles,
  Activity,
  LineChart,
  ShieldCheck,
} from 'lucide-react';

const steps = [
  {
    icon: <Rocket className="w-8 h-8 text-indigo-500" />,
    title: 'Start Your Mission',
    description:
      'Begin by creating a mission. Add your own quests or use our AI-powered system by simply describing your goal.',
  },
  {
    icon: <ListTodo className="w-8 h-8 text-indigo-500" />,
    title: 'Complete Quests',
    description:
      'Each completed quest earns you XP and stat boosts based on its difficulty. The system handles the rest.',
  },
  {
    icon: <Sparkles className="w-8 h-8 text-indigo-500" />,
    title: 'Maintain Streaks',
    description:
      'Daily quest streaks reward you with bonus coins and increase your growth rate. Stay consistent!',
  },
  {
    icon: <Activity className="w-8 h-8 text-indigo-500" />,
    title: 'Level Up & Unlock Skills',
    description:
      'Grow stronger by leveling up and unlocking powerful skills as your stats and level increase.',
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-indigo-500" />,
    title: 'Equip Artifacts',
    description:
      'Spend earned coins to buy rare and epic artifacts that boost your stats and give special effects.',
  },
  {
    icon: <LineChart className="w-8 h-8 text-indigo-500" />,
    title: 'Ascension Trials',
    description:
      'Trigger AI-powered Rank Ascension trials. Get detailed reports on your progress and performance.',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-4 sm:px-8 bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: -40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-bold mb-12 text-indigo-400 drop-shadow-md tracking-wide"
        >
          How It Works
        </motion.h2>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="bg-gray-900/70 backdrop-blur-md p-6 rounded-xl border border-indigo-800/40 shadow-lg hover:shadow-indigo-600/30 transition-shadow"
            >
              <div className="flex items-center justify-center mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold text-indigo-300 mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
