

import React, { useState, useMemo } from 'react';
import { Unit, PurchaseAmount, Resources, ResourceType } from '../types';
import { WEAPONS, UNIT_RANKS } from '../constants';
import { PowerIcon, MoneyIcon, SteelIcon, OilIcon, CustomizeIcon, AmmoIcon, WheatIcon } from './icons';

interface UnitCardProps {
  unit: Unit;
  resources: Resources;
  onPurchase: (unitId: string, amount: PurchaseAmount) => void;
  onCustomize: (unit: Unit) => void;
  formatNumber: (num: number) => string;
}

const resourceIcons: Record<ResourceType, React.ReactNode> = {
    gold: <MoneyIcon className="w-4 h-4 text-yellow-400" />,
    steel: <SteelIcon className="w-4 h-4 text-gray-400" />,
    oil: <OilIcon className="w-4 h-4 text-purple-400" />,
    ammo: <AmmoIcon className="w-4 h-4 text-orange-400" />,
    wheat: <WheatIcon className="w-4 h-4 text-emerald-400" />,
};

const UnitCard: React.FC<UnitCardProps> = ({ unit, resources, onPurchase, onCustomize, formatNumber }) => {
  const [purchaseAmount, setPurchaseAmount] = useState<PurchaseAmount>(1);

  const purchaseOptions: PurchaseAmount[] = [1, 10, 'MAX'];

  const canAfford = (cost: Resources, amount: number = 1) => {
    return Object.entries(cost).every(([resource, value]) => {
        return (Number(resources[resource as ResourceType]) || 0) >= (Number(value) || 0) * amount;
    });
  };

  const getMaxBuy = () => {
    let max = Infinity;
    for (const [resource, value] of Object.entries(unit.cost)) {
        if (typeof value === 'number' && value > 0) {
            const resourceAmount = Number(resources[resource as ResourceType]) || 0;
            max = Math.min(max, Math.floor(resourceAmount / value));
        }
    }
    return max === Infinity ? 0 : max;
  };
  
  const getCost = (amount: PurchaseAmount): Resources => {
    const numToBuy = amount === 'MAX' ? getMaxBuy() : amount;
    const totalCost: Resources = {};
    for (const [resource, value] of Object.entries(unit.cost)) {
      totalCost[resource as ResourceType] = (Number(value) || 0) * numToBuy;
    }
    return totalCost;
  };
  
  const currentCanAfford = useMemo(() => {
    if (purchaseAmount === 'MAX') {
      return getMaxBuy() > 0;
    }
    return canAfford(unit.cost, purchaseAmount);
  }, [resources, purchaseAmount, unit.cost]);
  
  const equippedWeapon = useMemo(() => WEAPONS[unit.currentWeaponId], [unit.currentWeaponId]);
  const weaponLevel = useMemo(() => unit.weaponLevels[unit.currentWeaponId] || 1, [unit.weaponLevels, unit.currentWeaponId]);
  
  const currentUnitRank = useMemo(() => UNIT_RANKS[unit.veterancyRank], [unit.veterancyRank]);
  const nextUnitRank = useMemo(() => UNIT_RANKS[unit.veterancyRank + 1], [unit.veterancyRank]);

  const totalPowerPerUnit = useMemo(() => {
    const weaponBonus = unit.basePower * (equippedWeapon.powerMultiplier - 1) + (unit.basePower * 0.1 * (weaponLevel - 1));
    const armorBonus = unit.basePower * 0.15 * (unit.armorLevel - 1);
    const rankBonusMultiplier = currentUnitRank?.powerBonusMultiplier || 1.0;
    return (unit.basePower + weaponBonus + armorBonus) * rankBonusMultiplier;
  }, [unit, equippedWeapon, weaponLevel, currentUnitRank]);
  
  const xpProgress = useMemo(() => {
    if (!nextUnitRank) return 100; // Max rank
    const xpForPrevRank = currentUnitRank.xpRequired;
    const xpForNextRank = nextUnitRank.xpRequired;
    const xpNeeded = xpForNextRank - xpForPrevRank;
    const xpGained = unit.xp - xpForPrevRank;
    if (xpNeeded <= 0) return 100;
    return (xpGained / xpNeeded) * 100;
  }, [unit.xp, currentUnitRank, nextUnitRank]);

  return (
    <div className="bg-base-200 border border-base-300 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/50 flex flex-col">
      <img src={unit.imageUrl} alt={unit.name} className="w-full h-32 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white">{unit.name}</h3>
        <p className="text-sm text-gray-400 mb-2">Owned: <span className="font-semibold text-secondary">{formatNumber(unit.owned)}</span></p>
        
        <div className="mb-2">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                <span>Rank: <span className="font-bold text-primary">{currentUnitRank.name}</span></span>
                {nextUnitRank && <span>{formatNumber(unit.xp)} / {formatNumber(nextUnitRank.xpRequired)} XP</span>}
            </div>
            <div className="w-full bg-base-300 rounded-full h-2 shadow-inner overflow-hidden border border-base-100">
                <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${xpProgress}%` }}
                ></div>
            </div>
        </div>

        <div className="text-xs text-gray-300 mb-3 space-y-1">
            <p>WPN: {equippedWeapon.name} (Lvl {weaponLevel})</p>
            <p>ARM: Lvl {unit.armorLevel}</p>
        </div>

        <div className="flex justify-between text-sm mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(unit.cost).map(([resource, value]) => (
                <div key={resource} className="flex items-center gap-1">
                    {resourceIcons[resource as ResourceType]}
                    <span>{formatNumber(Number(value) || 0)}</span>
                </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <PowerIcon className="w-4 h-4 text-red-400" />
            <span>{formatNumber(totalPowerPerUnit)}</span>
          </div>
        </div>

        <div className="mt-auto">
            <div className="flex justify-between items-center bg-base-300 rounded-md p-1 mb-3">
            {purchaseOptions.map(amount => (
                <button
                key={amount}
                onClick={() => setPurchaseAmount(amount)}
                className={`py-2 text-sm sm:py-1 sm:text-xs font-bold rounded-md transition-colors w-full ${purchaseAmount === amount ? 'bg-primary text-white' : 'bg-transparent text-gray-300 hover:bg-base-100'} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-base-300 focus-visible:ring-primary`}
                >
                x{amount}
                </button>
            ))}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onPurchase(unit.id, purchaseAmount)}
                    disabled={!currentCanAfford}
                    className="flex-grow bg-accent text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 enabled:hover:bg-green-500 enabled:active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-accent"
                    >
                    Buy ({purchaseAmount === 'MAX' ? formatNumber(getMaxBuy()) : purchaseAmount})
                </button>
                <button 
                    onClick={() => onCustomize(unit)} 
                    className="bg-sky-600 p-2 rounded-lg hover:bg-sky-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-sky-500"
                    aria-label={`Customize ${unit.name}`}
                >
                    <CustomizeIcon className="w-5 h-5 text-white"/>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UnitCard;
