
import React from 'react';
import { Resources, ResourceType, ScavengeRewards } from '../types';
import { WEAPONS } from '../constants';
import { ScavengeIcon, MoneyIcon, SteelIcon, OilIcon, AmmoIcon, HammerIcon, HostagesIcon, WheatIcon } from './icons';

type ScavengeResult = ScavengeRewards & {
  foundBlueprintId?: string;
}

interface ScavengeModalProps {
  result: ScavengeResult;
  onRansom: (hostages: number) => void;
  onConscript: (hostages: number) => void;
  onClose: () => void;
  formatNumber: (num: number) => string;
}

const resourceIcons: Record<ResourceType | 'blueprint' | 'hostages', React.ReactNode> = {
    gold: <MoneyIcon className="w-5 h-5 text-yellow-400" />,
    steel: <SteelIcon className="w-5 h-5 text-gray-400" />,
    oil: <OilIcon className="w-5 h-5 text-purple-400" />,
    ammo: <AmmoIcon className="w-5 h-5 text-orange-400" />,
    wheat: <WheatIcon className="w-5 h-5 text-emerald-400" />,
    blueprint: <HammerIcon className="w-5 h-5 text-secondary" />,
    hostages: <HostagesIcon className="w-5 h-5 text-sky-400" />,
};

const ScavengeModal: React.FC<ScavengeModalProps> = ({ result, onRansom, onConscript, onClose, formatNumber }) => {
  const hasHostages = (result.hostages ?? 0) > 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-base-200 border border-green-500 rounded-xl shadow-2xl p-8 text-center max-w-md w-full transform transition-all animate-jump-in"
      >
        <div className="mx-auto bg-green-500/80 rounded-full w-20 h-20 flex items-center justify-center mb-4 border-4 border-green-500">
          <ScavengeIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-green-400 uppercase tracking-wider mb-2">
          Victory!
        </h2>
        <p className="text-gray-300 mb-6">
          Your forces have crushed the enemy. The battlefield is yours to scavenge.
        </p>

        <div className="bg-base-300/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-bold text-lg text-white mb-2">Scavenge Report:</h3>
            <div className="space-y-2">
                {Object.entries(result.resources).map(([res, val]) => {
                    if ((val ?? 0) === 0) return null;
                    return (
                        <div key={res} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {resourceIcons[res as ResourceType]}
                                <span className="capitalize">{res}</span>
                            </div>
                            <span className="font-mono font-bold text-green-400">
                                +{formatNumber(Number(val) || 0)}
                            </span>
                        </div>
                    );
                })}
                {result.foundBlueprintId && (
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {resourceIcons.blueprint}
                            <span>Blueprint Found</span>
                        </div>
                        <span className="font-mono font-bold text-secondary">
                            {WEAPONS[result.foundBlueprintId]?.name}
                        </span>
                    </div>
                )}
                 {hasHostages && (
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {resourceIcons.hostages}
                            <span>Hostages Captured</span>
                        </div>
                        <span className="font-mono font-bold text-sky-400">
                            {result.hostages}
                        </span>
                    </div>
                )}
            </div>
        </div>

        {hasHostages ? (
            <div className="space-y-3">
                <p className="text-sm text-gray-400">Decide the fate of the prisoners:</p>
                <div className="flex gap-4">
                    <button onClick={() => onRansom(result.hostages ?? 0)} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-yellow-500">
                        Ransom
                    </button>
                    <button onClick={() => onConscript(result.hostages ?? 0)} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-sky-500">
                        Conscript
                    </button>
                </div>
            </div>
        ) : (
            <button
              onClick={onClose}
              className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-primary"
            >
              Continue
            </button>
        )}
      </div>
    </div>
  );
};

export default ScavengeModal;
