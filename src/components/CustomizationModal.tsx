



import React from 'react';
import { Unit, Resources, ResourceType } from '../types';
import { WEAPONS } from '../constants';
import { PowerIcon, UpgradeIcon, MoneyIcon, SteelIcon, OilIcon } from './icons';

interface CustomizationModalProps {
  unit: Unit | null;
  resources: Resources;
  onClose: () => void;
  onUpgradeWeapon: (unitId: string, weaponId: string) => void;
  onUnlockWeapon: (unitId: string, weaponId: string) => void;
  onSwitchWeapon: (unitId: string, weaponId: string) => void;
  onUpgradeArmor: (unitId: string) => void;
  formatNumber: (num: number) => string;
  craftedWeaponIds: string[];
}

const resourceIcons: Record<ResourceType, React.ReactNode> = {
    gold: <MoneyIcon className="w-4 h-4 text-yellow-400" />,
    steel: <SteelIcon className="w-4 h-4 text-gray-400" />,
    oil: <OilIcon className="w-4 h-4 text-purple-400" />,
};

const CustomizationModal: React.FC<CustomizationModalProps> = ({ unit, resources, onClose, onUpgradeWeapon, onUnlockWeapon, onSwitchWeapon, onUpgradeArmor, formatNumber, craftedWeaponIds }) => {
  if (!unit) return null;

  const getUpgradeCost = (level: number, baseCost: Resources): Resources => {
      const multiplier = Math.pow(1.5, level - 1);
      const cost: Resources = {};
      for (const [res, val] of Object.entries(baseCost)) {
          // FIX: Ensure value is a number before arithmetic operation.
          cost[res as ResourceType] = Math.floor((Number(val) || 0) * multiplier);
      }
      return cost;
  }

  const canAfford = (cost: Resources) => {
      return Object.entries(cost).every(([res, val]) => (resources[res as ResourceType] ?? 0) >= (val ?? 0));
  }

  const currentWeaponId = unit.currentWeaponId;
  const currentWeapon = WEAPONS[currentWeaponId];
  const currentWeaponLevel = unit.weaponLevels[currentWeaponId] || 1;
  const weaponUpgradeCost = getUpgradeCost(currentWeaponLevel, unit.upgradeCostBase);
  const armorUpgradeCost = getUpgradeCost(unit.armorLevel, unit.upgradeCostBase);

  const canAffordWeapon = canAfford(weaponUpgradeCost);
  const canAffordArmor = canAfford(armorUpgradeCost);

  const totalPowerPerUnit = (weaponLvl: number, armorLvl: number) => {
    const weaponBonus = unit.basePower * (currentWeapon.powerMultiplier - 1) + (unit.basePower * 0.1 * (weaponLvl - 1));
    const armorBonus = unit.basePower * 0.15 * (armorLvl - 1);
    return unit.basePower + weaponBonus + armorBonus;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-base-200 border border-primary/50 rounded-xl shadow-2xl p-6 max-w-lg w-full transform transition-all animate-jump-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <img src={unit.imageUrl} alt={unit.name} className="w-16 h-16 rounded-md object-cover mr-4" />
          <div>
            <h2 className="text-2xl font-bold text-primary">Customize {unit.name}</h2>
            <div className="flex items-center gap-1 text-gray-300">
                <PowerIcon className="w-5 h-5 text-red-400"/>
                <span className="font-bold">{formatNumber(totalPowerPerUnit(currentWeaponLevel, unit.armorLevel))}</span>
                <span>Power</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
            {/* Weapon Upgrade */}
            <div className="bg-base-300 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-white">Weapon System</h3>
                        <p className="text-sm text-gray-400">Current Level: {currentWeaponLevel}</p>
                    </div>
                    <button 
                        onClick={() => onUpgradeWeapon(unit.id, currentWeaponId)}
                        disabled={!canAffordWeapon}
                        className="bg-accent text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 enabled:hover:bg-green-500 enabled:active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <UpgradeIcon className="w-5 h-5" />
                        Upgrade
                    </button>
                </div>
                <div className="text-sm mt-2">
                    <p className="text-gray-300">Next Level Power: <span className="text-green-400">+{formatNumber(totalPowerPerUnit(currentWeaponLevel + 1, unit.armorLevel) - totalPowerPerUnit(currentWeaponLevel, unit.armorLevel))}</span></p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-gray-400">Cost:</span>
                        {Object.entries(weaponUpgradeCost).map(([res, val]) => (
                            <div key={res} className="flex items-center gap-1 text-gray-300">
                                {resourceIcons[res as ResourceType]}
                                <span>{formatNumber(val ?? 0)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Armor Upgrade */}
            <div className="bg-base-300 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-white">Armor Plating</h3>
                        <p className="text-sm text-gray-400">Current Level: {unit.armorLevel}</p>
                    </div>
                    <button 
                        onClick={() => onUpgradeArmor(unit.id)}
                        disabled={!canAffordArmor}
                        className="bg-accent text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 enabled:hover:bg-green-500 enabled:active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                         <UpgradeIcon className="w-5 h-5" />
                         Upgrade
                    </button>
                </div>
                 <div className="text-sm mt-2">
                    <p className="text-gray-300">Next Level Power: <span className="text-green-400">+{formatNumber(totalPowerPerUnit(currentWeaponLevel, unit.armorLevel + 1) - totalPowerPerUnit(currentWeaponLevel, unit.armorLevel))}</span></p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-gray-400">Cost:</span>
                        {Object.entries(armorUpgradeCost).map(([res, val]) => (
                            <div key={res} className="flex items-center gap-1 text-gray-300">
                                {resourceIcons[res as ResourceType]}
                                <span>{formatNumber(val ?? 0)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-sky-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CustomizationModal;
