

import React from 'react';
import { Resources, ResourceType } from '../types';
import { SwordsIcon, MoneyIcon, SteelIcon, OilIcon, AmmoIcon, WheatIcon } from './icons';

type BattleResult = {
  outcome: 'victory' | 'defeat';
  rewards?: Resources;
  penalties?: Resources;
};

interface BattleResultModalProps {
  result: BattleResult;
  onClose: () => void;
  formatNumber: (num: number) => string;
}

const resourceIcons: Record<ResourceType, React.ReactNode> = {
    gold: <MoneyIcon className="w-5 h-5 text-yellow-400" />,
    steel: <SteelIcon className="w-5 h-5 text-gray-400" />,
    oil: <OilIcon className="w-5 h-5 text-purple-400" />,
    ammo: <AmmoIcon className="w-5 h-5 text-orange-400" />,
    wheat: <WheatIcon className="w-5 h-5 text-emerald-400" />,
};


const BattleResultModal: React.FC<BattleResultModalProps> = ({ result, onClose, formatNumber }) => {
  const isVictory = result.outcome === 'victory';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-base-200 border ${isVictory ? 'border-green-500' : 'border-red-500'} rounded-xl shadow-2xl p-8 text-center max-w-md w-full transform transition-all animate-jump-in`}
      >
        <div className={`mx-auto ${isVictory ? 'bg-green-500/80' : 'bg-red-500/80'} rounded-full w-20 h-20 flex items-center justify-center mb-4 border-4 ${isVictory ? 'border-green-500' : 'border-red-500'}`}>
          <SwordsIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className={`text-3xl sm:text-4xl font-black ${isVictory ? 'text-green-400' : 'text-red-400'} uppercase tracking-wider mb-2`}>
          {isVictory ? 'Victory!' : 'Defeat!'}
        </h2>
        <p className="text-gray-300 mb-6">
          {isVictory ? 'You have crushed the enemy and claimed the spoils of war.' : 'Your forces have been repelled. Reinforce and try again.'}
        </p>

        <div className="bg-base-300/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-bold text-lg text-white mb-2">{isVictory ? 'Resources Gained:' : 'Resources Lost:'}</h3>
            <div className="space-y-2">
                {(isVictory ? Object.entries(result.rewards || {}) : Object.entries(result.penalties || {})).map(([res, val]) => (
                    <div key={res} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {resourceIcons[res as ResourceType]}
                            <span className="capitalize">{res}</span>
                        </div>
                        <span className={`font-mono font-bold ${isVictory ? 'text-green-400' : 'text-red-400'}`}>
                            {isVictory ? '+' : '-'}{formatNumber(Number(val) || 0)}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-primary"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BattleResultModal;
