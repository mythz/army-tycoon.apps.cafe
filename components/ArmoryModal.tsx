

import React, { useState } from 'react';
import { Resources, ResourceType } from '../types';
import { WEAPONS, INITIAL_UNITS } from '../constants';
import { MoneyIcon, SteelIcon, OilIcon, PowerIcon, HammerIcon, CheckCircleIcon, TankIcon, AmmoIcon, WheatIcon } from './icons';

interface ArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resources;
  craftedWeaponIds: string[];
  onCraftWeapon: (weaponId: string) => void;
  craftedUnitIds: string[];
  onCraftUnit: (unitId: string) => void;
  formatNumber: (num: number) => string;
}

const resourceIcons: Record<ResourceType, React.ReactNode> = {
    gold: <MoneyIcon className="w-4 h-4 text-yellow-400" />,
    steel: <SteelIcon className="w-4 h-4 text-gray-400" />,
    oil: <OilIcon className="w-4 h-4 text-purple-400" />,
    ammo: <AmmoIcon className="w-4 h-4 text-orange-400" />,
    wheat: <WheatIcon className="w-4 h-4 text-emerald-400" />,
};

const ArmoryModal: React.FC<ArmoryModalProps> = ({ isOpen, onClose, resources, craftedWeaponIds, onCraftWeapon, craftedUnitIds, onCraftUnit, formatNumber }) => {
  if (!isOpen) return null;
  const [activeTab, setActiveTab] = useState<'weapons' | 'vehicles'>('weapons');

  const canAfford = (cost: Resources) => {
    if (Object.keys(cost).length === 0) return false;
    return Object.entries(cost).every(([res, val]) => (Number(resources[res as ResourceType]) || 0) >= (Number(val) || 0));
  }

  const craftableUnits = INITIAL_UNITS.filter(unit => Object.keys(unit.craftingCost).length > 0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-base-200 border border-secondary/50 rounded-xl shadow-2xl p-6 max-w-4xl w-full transform transition-all animate-jump-in flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <HammerIcon className="w-8 h-8 text-secondary mr-3" />
          <h2 className="text-2xl font-bold text-secondary">Armory - Research & Development</h2>
        </div>
        
        <div className="flex border-b border-base-300 mb-2">
            <button 
                onClick={() => setActiveTab('weapons')}
                className={`flex items-center gap-2 py-2 px-4 font-bold transition-colors rounded-t-md ${activeTab === 'weapons' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-400 hover:text-white'} focus:outline-none focus-visible:bg-base-300/50`}
            >
                <HammerIcon className="w-5 h-5"/> Weapon Systems
            </button>
            <button 
                onClick={() => setActiveTab('vehicles')}
                className={`flex items-center gap-2 py-2 px-4 font-bold transition-colors rounded-t-md ${activeTab === 'vehicles' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-400 hover:text-white'} focus:outline-none focus-visible:bg-base-300/50`}
            >
                <TankIcon className="w-5 h-5"/> Vehicle Blueprints
            </button>
        </div>

        <div className="bg-base-100 rounded-md p-2 flex-grow overflow-y-auto max-h-[70vh]">
          {activeTab === 'weapons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.values(WEAPONS).map(weapon => {
                const isCrafted = craftedWeaponIds.includes(weapon.id);
                const canCraft = canAfford(weapon.craftingCost);

                return (
                  <div key={weapon.id} className="bg-base-300 rounded-lg p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white">{weapon.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{weapon.description}</p>
                      <div className="text-sm flex items-center gap-2 mb-2 text-red-400 font-semibold">
                        <PowerIcon className="w-4 h-4" />
                        <span>{weapon.powerMultiplier}x Power</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="text-gray-400 font-semibold">Craft Cost:</span>
                        {Object.keys(weapon.craftingCost).length > 0 ? Object.entries(weapon.craftingCost).map(([res, val]) => (
                          <div key={res} className="flex items-center gap-1">
                            {resourceIcons[res as ResourceType]}
                            <span>{formatNumber(Number(val) || 0)}</span>
                          </div>
                        )) : <span className="text-gray-500">None</span>}
                      </div>
                    </div>
                    <div className="mt-3">
                      {isCrafted ? (
                        <button disabled className="w-full bg-accent text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 cursor-default">
                          <CheckCircleIcon className="w-5 h-5"/>
                          Crafted
                        </button>
                      ) : (
                        <button
                          onClick={() => onCraftWeapon(weapon.id)}
                          disabled={!canCraft || Object.keys(weapon.craftingCost).length === 0}
                          className="w-full bg-secondary/80 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 enabled:hover:bg-secondary disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-300 focus-visible:ring-secondary"
                        >
                          <HammerIcon className="w-5 h-5"/>
                          Craft Blueprint
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {craftableUnits.map(unit => {
                    const isCrafted = craftedUnitIds.includes(unit.id);
                    const canCraft = canAfford(unit.craftingCost);
                    return (
                        <div key={unit.id} className="bg-base-300 rounded-lg p-3 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-white">{unit.name}</h3>
                                <p className="text-xs text-gray-400 mb-2">{unit.description}</p>
                                <div className="text-sm flex items-center gap-2 mb-2 text-red-400 font-semibold">
                                    <PowerIcon className="w-4 h-4" />
                                    <span>Base Power: {formatNumber(unit.basePower)}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                    <span className="text-gray-400 font-semibold">Craft Cost:</span>
                                    {Object.entries(unit.craftingCost).map(([res, val]) => (
                                      <div key={res} className="flex items-center gap-1">
                                        {resourceIcons[res as ResourceType]}
                                        <span>{formatNumber(Number(val) || 0)}</span>
                                      </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-3">
                                {isCrafted ? (
                                    <button disabled className="w-full bg-accent text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 cursor-default">
                                    <CheckCircleIcon className="w-5 h-5"/>
                                    Crafted
                                    </button>
                                ) : (
                                    <button
                                    onClick={() => onCraftUnit(unit.id)}
                                    disabled={!canCraft}
                                    className="w-full bg-secondary/80 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 enabled:hover:bg-secondary disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-300 focus-visible:ring-secondary"
                                    >
                                    <HammerIcon className="w-5 h-5"/>
                                    Craft Blueprint
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 focus-visible:ring-primary"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ArmoryModal;
