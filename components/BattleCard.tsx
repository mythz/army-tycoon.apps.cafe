
import React from 'react';
import { Enemy, ResourceType } from '../types';
import { PowerIcon, SwordsIcon, MoneyIcon, SteelIcon, OilIcon, AmmoIcon, HammerIcon, HostagesIcon, WheatIcon } from './icons';

interface BattleCardProps {
    enemy: Enemy;
    playerPower: number;
    playerAmmo: number;
    onBattle: () => void;
    formatNumber: (num: number) => string;
}

const resourceIcons: Record<ResourceType, React.ReactNode> = {
    gold: <MoneyIcon className="w-4 h-4 text-yellow-400" />,
    steel: <SteelIcon className="w-4 h-4 text-gray-400" />,
    oil: <OilIcon className="w-4 h-4 text-purple-400" />,
    ammo: <AmmoIcon className="w-4 h-4 text-orange-400" />,
    wheat: <WheatIcon className="w-4 h-4 text-emerald-400" />,
};

const BATTLE_AMMO_COST = 1000;

const BattleCard: React.FC<BattleCardProps> = ({ enemy, playerPower, playerAmmo, onBattle, formatNumber }) => {
    const canWin = playerPower >= enemy.militaryPower;
    const hasEnoughAmmo = playerAmmo >= BATTLE_AMMO_COST;
    const powerRatio = playerPower / enemy.militaryPower;

    let recommendationText = 'High Risk';
    let recommendationColor = 'text-red-400';

    if (powerRatio >= 1.5) {
        recommendationText = 'Overwhelming Advantage';
        recommendationColor = 'text-green-400';
    } else if (powerRatio >= 1) {
        recommendationText = 'Advantage';
        recommendationColor = 'text-yellow-400';
    } else if (powerRatio >= 0.75) {
        recommendationText = 'Tough Fight';
        recommendationColor = 'text-orange-400';
    }

    return (
        <div className="bg-base-200/50 p-4 rounded-lg shadow-xl mb-4 border border-base-300">
            <h2 className="text-xl font-bold text-gray-300 mb-2">Next Target: <span className="text-red-400">{enemy.name}</span></h2>
            <div className="flex flex-col md:flex-row gap-4">
                <img src={enemy.imageUrl} alt={enemy.name} className="w-full md:w-48 h-32 md:h-auto object-cover rounded-md" />
                <div className="flex-grow flex flex-col justify-between">
                    <div>
                        <p className="text-sm text-gray-400 mb-2">{enemy.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-base-300/50 p-2 rounded-md">
                                <p className="text-gray-400 font-semibold">Enemy Power</p>
                                <div className="flex items-center gap-1 font-bold text-red-400">
                                    <PowerIcon className="w-4 h-4" />
                                    <span>{formatNumber(enemy.militaryPower)}</span>
                                </div>
                            </div>
                            <div className="bg-base-300/50 p-2 rounded-md">
                                <p className="text-gray-400 font-semibold">Your Power</p>
                                <div className={`flex items-center gap-1 font-bold ${canWin ? 'text-green-400' : 'text-red-400'}`}>
                                    <PowerIcon className="w-4 h-4" />
                                    <span>{formatNumber(playerPower)}</span>
                                </div>
                            </div>
                             <div className="bg-base-300/50 p-2 rounded-md col-span-2">
                                <p className="text-gray-400 font-semibold mb-1">Potential Spoils of War</p>
                                <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                                    {Object.entries(enemy.scavengeRewards.resources).map(([res, val]) => (
                                        (Number(val) || 0) > 0 && (
                                            <div key={res} className="flex items-center gap-1 text-xs font-semibold text-gray-200" title={`${formatNumber(Number(val) || 0)} ${res}`}>
                                                {resourceIcons[res as ResourceType]}
                                                <span>{formatNumber(Number(val) || 0)}</span>
                                            </div>
                                        )
                                    ))}
                                    {enemy.scavengeRewards.weaponBlueprintIds && enemy.scavengeRewards.weaponBlueprintIds.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs font-semibold text-secondary" title="Chance to find a weapon blueprint">
                                            <HammerIcon className="w-4 h-4" />
                                            <span>Blueprint</span>
                                        </div>
                                    )}
                                    {(enemy.scavengeRewards.hostages ?? 0) > 0 && (
                                        <div className="flex items-center gap-1 text-xs font-semibold text-sky-400" title={`Capture up to ${enemy.scavengeRewards.hostages} hostages`}>
                                            <HostagesIcon className="w-4 h-4" />
                                            <span>Hostages</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                             <div className="bg-base-300/50 p-2 rounded-md col-span-2">
                                <p className="text-gray-400 font-semibold">Recommendation</p>
                                <span className={`font-bold ${recommendationColor}`}>{recommendationText}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={onBattle}
                            disabled={!hasEnoughAmmo}
                            className={`w-full font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-all duration-200 text-lg text-white ${canWin ? 'bg-green-600 enabled:hover:bg-green-500' : 'bg-red-600 enabled:hover:bg-red-500'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
                        >
                            <SwordsIcon className="w-6 h-6" />
                            BATTLE!
                        </button>
                        <p className={`text-center text-xs mt-1.5 ${hasEnoughAmmo ? 'text-gray-400' : 'text-red-400 font-semibold'}`}>
                            Cost: {formatNumber(BATTLE_AMMO_COST)} Ammo
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleCard;