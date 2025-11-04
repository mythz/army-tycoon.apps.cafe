
import React from 'react';
import { Rank, Resources } from '../types';
import { MoneyIcon, PowerIcon, RankIcon, SteelIcon, OilIcon, AmmoIcon, WheatIcon, TroopsIcon } from './icons';

interface HeaderProps {
  resources: Resources;
  militaryPower: number;
  incomePerSecond: Resources;
  currentRank: Rank;
  formatNumber: (num: number) => string;
  isStarving: boolean;
  starvationTimer: number;
  totalCrew: number;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; income: string; color: string; className?: string; }> = ({ icon, label, value, income, color, className }) => (
  <div className={`bg-base-200/60 p-3 rounded-lg flex items-center shadow-md border border-base-300 ${className}`}>
    <div className={`mr-3 p-2 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 uppercase font-bold">{label}</p>
      <div className="flex items-baseline">
        <p className="text-lg font-black text-white">{value}</p>
        {income && <p className={`text-xs ml-1.5 ${income.startsWith('-') ? 'text-red-400' : 'text-accent'}`}>{income}/s</p>}
      </div>
    </div>
  </div>
);

const Header: React.FC<HeaderProps> = ({ resources, militaryPower, incomePerSecond, currentRank, formatNumber, isStarving, starvationTimer, totalCrew }) => {
  return (
    <header className="w-full max-w-7xl bg-base-300/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-base-300/50 sticky top-2 sm:top-4 z-40">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <StatCard 
          icon={<MoneyIcon className="w-6 h-6 text-white"/>} 
          label="Gold" 
          value={`${formatNumber(resources.gold ?? 0)}`}
          income={`+${formatNumber(incomePerSecond.gold ?? 0)}`}
          color="bg-yellow-500/80"
        />
         <StatCard 
          icon={<WheatIcon className="w-6 h-6 text-white"/>} 
          label="Wheat" 
          value={formatNumber(resources.wheat ?? 0)}
          income={`${(incomePerSecond.wheat ?? 0) >= 0 ? '+' : ''}${formatNumber(incomePerSecond.wheat ?? 0)}`}
          color="bg-emerald-500/80"
        />
        <StatCard 
          icon={<SteelIcon className="w-6 h-6 text-white"/>} 
          label="Steel" 
          value={formatNumber(resources.steel ?? 0)}
          income={`+${formatNumber(incomePerSecond.steel ?? 0)}`}
          color="bg-gray-500/80"
        />
        <StatCard 
          icon={<OilIcon className="w-6 h-6 text-white"/>} 
          label="Oil" 
          value={formatNumber(resources.oil ?? 0)}
          income={`+${formatNumber(incomePerSecond.oil ?? 0)}`}
          color="bg-purple-500/80"
        />
         <StatCard 
          icon={<AmmoIcon className="w-6 h-6 text-white"/>} 
          label="Ammo" 
          value={formatNumber(resources.ammo ?? 0)}
          income={`+${formatNumber(incomePerSecond.ammo ?? 0)}`}
          color="bg-orange-500/80"
        />
        <StatCard 
          icon={<PowerIcon className="w-6 h-6 text-white"/>} 
          label="Military Power" 
          value={formatNumber(militaryPower)}
          income=""
          color="bg-red-500/80"
          className={isStarving ? 'animate-pulse border-red-500' : ''}
        />
        <StatCard 
          icon={<TroopsIcon className="w-6 h-6 text-white"/>} 
          label="Total Troops" 
          value={formatNumber(totalCrew)}
          income=""
          color="bg-indigo-500/80"
        />
        <StatCard 
          icon={<RankIcon className="w-6 h-6 text-white"/>} 
          label="Rank" 
          value={currentRank.name}
          income=""
          color="bg-sky-500/80"
        />
      </div>
       {isStarving && (
          <p className="text-center text-red-400 font-semibold text-sm mt-2 animate-pulse">
              ! STARVATION PENALTY: MILITARY POWER HALVED | GAME OVER IN {Math.ceil(starvationTimer)}s !
          </p>
       )}
    </header>
  );
};

export default Header;
