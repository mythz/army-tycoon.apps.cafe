

import React, { useState, useMemo } from 'react';
import { Unit, Resources, ResourceType, Weapon } from '../types';
import { WEAPONS } from '../constants';
import { PowerIcon, UpgradeIcon, MoneyIcon, SteelIcon, OilIcon, LockClosedIcon, CheckCircleIcon, AmmoIcon, WheatIcon } from './icons';

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
    ammo: <AmmoIcon className="w-4 h-4 text-orange-400" />,
    wheat: <WheatIcon className="w-4 h-4 text-emerald-400" />,
};

const CustomizationModal: React.FC<CustomizationModalProps> = ({ unit, resources, onClose, onUpgradeWeapon, onUnlockWeapon, onSwitchWeapon, onUpgradeArmor, formatNumber, craftedWeaponIds }) => {
  if (!unit) return null;

  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(unit.currentWeaponId);
  const selectedWeapon = WEAPONS[selectedWeaponId];

  const canAfford = (cost: Resources) => {
    if (!cost) return true;
    return Object.entries(cost).every(([res, val]) => (Number(resources[res as ResourceType]) || 0) >= (Number(val) || 0));
  }

  const getUpgradeCost = (baseCost: Resources, level: number): Resources => {
      const multiplier = Math.pow(1.5, level - 1);
      const cost: Resources = {};
      for (const [res, val] of Object.entries(baseCost)) {
          cost[res as ResourceType] = Math.floor((Number(val) || 0) * multiplier);
      }
      return cost;
  }
  
  const armorUpgradeCost = getUpgradeCost(unit.upgradeCostBase, unit.armorLevel);
  const canAffordArmor = canAfford(armorUpgradeCost);

  const totalPowerPerUnit = (weapon: Weapon, weaponLvl: number, armorLvl: number) => {
    const weaponBonus = unit.basePower * (weapon.powerMultiplier - 1) + (unit.basePower * 0.1 * (weaponLvl - 1));
    const armorBonus = unit.basePower * 0.15 * (armorLvl - 1);
    return unit.basePower + weaponBonus + armorBonus;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-base-200 border border-primary/50 rounded-xl shadow-2xl p-6 max-w-3xl w-full transform transition-all animate-jump-in flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center">
            <img src={unit.imageUrl} alt={unit.name} className="w-16 h-16 rounded-md object-cover mr-4" />
            <div>
                <h2 className="text-2xl font-bold text-primary">Customize {unit.name}</h2>
                <p className="text-gray-400">Configure your unit's loadout and upgrades.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weapon Selection List */}
            <div className="md:col-span-1 bg-base-300/50 p-2 rounded-lg flex flex-col">
                <h3 className="text-lg font-bold text-white px-2 pb-2">Available Systems</h3>
                <div className="flex-grow space-y-2 overflow-y-auto">
                    {unit.availableWeaponIds
                        .filter(weaponId => craftedWeaponIds.includes(weaponId))
                        .map(weaponId => {
                        const weapon = WEAPONS[weaponId];
                        const isSelected = selectedWeaponId === weaponId;
                        const isEquipped = unit.currentWeaponId === weaponId;
                        const isUnlocked = unit.unlockedWeaponIds.includes(weaponId);

                        return (
                            <button 
                                key={weaponId} 
                                onClick={() => setSelectedWeaponId(weaponId)}
                                className={`w-full text-left p-2 rounded-md flex items-center justify-between transition-colors ${isSelected ? 'bg-primary/80' : 'bg-base-200 hover:bg-base-100'} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-300 focus-visible:ring-primary`}
                            >
                                <div>
                                    <p className="font-bold text-white">{weapon.name}</p>
                                    <p className="text-xs text-gray-300">Lvl: {unit.weaponLevels[weaponId] ?? 1}</p>
                                </div>
                                {isEquipped ? <CheckCircleIcon className="w-5 h-5 text-accent"/> : !isUnlocked && <LockClosedIcon className="w-5 h-5 text-gray-400" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Weapon Details and Actions */}
            <div className="md:col-span-2 bg-base-300/50 p-4 rounded-lg flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold text-secondary">{selectedWeapon.name}</h3>
                    <p className="text-sm text-gray-400 mt-1 mb-3">{selectedWeapon.description}</p>
                    <div className="bg-base-100 p-3 rounded-md space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">Power Multiplier:</span>
                            <span className="font-bold text-white">{selectedWeapon.powerMultiplier}x</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">Current Level:</span>
                            <span className="font-bold text-white">{unit.weaponLevels[selectedWeaponId] ?? 1}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">Power w/ this Weapon:</span>
                            <span className="font-bold text-red-400 flex items-center gap-1">
                                <PowerIcon className="w-4 h-4"/>
                                {formatNumber(totalPowerPerUnit(selectedWeapon, unit.weaponLevels[selectedWeaponId] ?? 1, unit.armorLevel))}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4">
                    {(() => {
                        const isUnlocked = unit.unlockedWeaponIds.includes(selectedWeaponId);
                        const isEquipped = unit.currentWeaponId === selectedWeaponId;
                        
                        if (!isUnlocked) {
                             const canAffordUnlock = canAfford(selectedWeapon.unlockCost);
                            return (
                                <button
                                    onClick={() => onUnlockWeapon(unit.id, selectedWeaponId)}
                                    disabled={!canAffordUnlock}
                                    className="w-full bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 enabled:hover:bg-yellow-500 disabled:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-yellow-500"
                                >
                                    <LockClosedIcon className="w-5 h-5"/>
                                    Unlock for 
                                    {Object.entries(selectedWeapon.unlockCost).map(([res, val]) => (
                                        <div key={res} className="flex items-center gap-1 ml-2">
                                            {resourceIcons[res as ResourceType]}
                                            <span>{formatNumber(Number(val) || 0)}</span>
                                        </div>
                                    ))}
                                </button>
                            );
                        }
                        if (!isEquipped) {
                            return <button onClick={() => onSwitchWeapon(unit.id, selectedWeaponId)} className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-sky-500">Equip Weapon</button>;
                        }
                        return <button disabled className="w-full bg-accent text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 cursor-default">
                                <CheckCircleIcon className="w-5 h-5"/>
                                Equipped
                                </button>;
                    })()}
                </div>
            </div>
        </div>

        {/* Upgrade Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weapon Upgrade */}
            <div className="bg-base-300 p-4 rounded-lg">
                 <h3 className="font-bold text-lg text-white mb-2">Upgrade: <span className="text-secondary">{selectedWeapon.name}</span></h3>
                 <div className="text-sm">
                    <p className="text-gray-300">Next Level Power: <span className="text-green-400">+{formatNumber(totalPowerPerUnit(selectedWeapon, (unit.weaponLevels[selectedWeaponId] ?? 1) + 1, unit.armorLevel) - totalPowerPerUnit(selectedWeapon, unit.weaponLevels[selectedWeaponId] ?? 1, unit.armorLevel))}</span></p>
                    <div className="flex items-center gap-2 flex-wrap mt-1 mb-3">
                         <span className="text-gray-400">Cost:</span>
                         {Object.entries(getUpgradeCost(unit.upgradeCostBase, unit.weaponLevels[selectedWeaponId] ?? 1)).map(([res, val]) => (
                            <div key={res} className="flex items-center gap-1 text-gray-300">{resourceIcons[res as ResourceType]}<span>{formatNumber(Number(val) || 0)}</span></div>
                         ))}
                    </div>
                     <button 
                        onClick={() => onUpgradeWeapon(unit.id, selectedWeaponId)}
                        disabled={!canAfford(getUpgradeCost(unit.upgradeCostBase, unit.weaponLevels[selectedWeaponId] ?? 1))}
                        className="w-full bg-accent text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 enabled:hover:bg-green-500 disabled:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-300 focus-visible:ring-accent"
                    ><UpgradeIcon className="w-5 h-5" />Upgrade Weapon</button>
                </div>
            </div>
            {/* Armor Upgrade */}
            <div className="bg-base-300 p-4 rounded-lg">
                 <h3 className="font-bold text-lg text-white mb-2">Upgrade: Armor Plating</h3>
                 <div className="text-sm">
                    <p className="text-gray-300">Next Level Power: <span className="text-green-400">+{formatNumber(totalPowerPerUnit(WEAPONS[unit.currentWeaponId], unit.weaponLevels[unit.currentWeaponId], unit.armorLevel + 1) - totalPowerPerUnit(WEAPONS[unit.currentWeaponId], unit.weaponLevels[unit.currentWeaponId], unit.armorLevel))}</span></p>
                    <div className="flex items-center gap-2 flex-wrap mt-1 mb-3">
                        <span className="text-gray-400">Cost:</span>
                        {Object.entries(armorUpgradeCost).map(([res, val]) => (
                            <div key={res} className="flex items-center gap-1 text-gray-300">{resourceIcons[res as ResourceType]}<span>{formatNumber(Number(val) || 0)}</span></div>
                        ))}
                    </div>
                     <button 
                        onClick={() => onUpgradeArmor(unit.id)}
                        disabled={!canAffordArmor}
                        className="w-full bg-accent text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 enabled:hover:bg-green-500 disabled:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-300 focus-visible:ring-accent"
                    ><UpgradeIcon className="w-5 h-5" />Upgrade Armor</button>
                </div>
            </div>
        </div>

        <button onClick={onClose} className="mt-2 w-full bg-primary/80 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-primary">Close</button>
      </div>
    </div>
  );
};

export default CustomizationModal;
