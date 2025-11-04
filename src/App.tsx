




// FIX: Added Weapon to imports for type casting below.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Unit, Rank, PurchaseAmount, Resources, ResourceType, ResourceGenerator, Weapon } from './types';
import { INITIAL_UNITS, RANKS, RESOURCE_GENERATORS, WEAPONS } from './constants';
import Header from './components/Header';
import UnitCard from './components/UnitCard';
import GeneratorCard from './components/GeneratorCard';
import ProgressBar from './components/ProgressBar';
import RankUpModal from './components/RankUpModal';
import AdvisorModal from './components/AdvisorModal';
import CustomizationModal from './components/CustomizationModal';
import { getAdvice } from './services/geminiService';
import { BrainCircuitIcon } from './components/icons';

const formatNumber = (num: number): string => {
  if (num < 1e3) return num.toFixed(0);
  if (num < 1e6) return `${(num / 1e3).toFixed(2)}K`;
  if (num < 1e9) return `${(num / 1e6).toFixed(2)}M`;
  if (num < 1e12) return `${(num / 1e9).toFixed(2)}B`;
  if (num < 1e15) return `${(num / 1e12).toFixed(2)}T`;
  return `>${(num / 1e15).toExponential(2)}`;
};

const App: React.FC = () => {
  const [resources, setResources] = useState<Resources>({ gold: 100, steel: 0, oil: 0 });
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [generators, setGenerators] = useState<ResourceGenerator[]>(RESOURCE_GENERATORS);
  const [currentRankIndex, setCurrentRankIndex] = useState<number>(0);
  const [showRankUpModal, setShowRankUpModal] = useState<boolean>(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState<boolean>(false);
  const [customizingUnit, setCustomizingUnit] = useState<Unit | null>(null);
  const [advisorResponse, setAdvisorResponse] = useState<string>('');
  const [isAdvisorLoading, setIsAdvisorLoading] = useState<boolean>(false);

  const militaryPower = useMemo(() => {
    return units.reduce((total, unit) => {
        const weaponLevel = unit.weaponLevels[unit.currentWeaponId] || 1;
        const equippedWeapon = WEAPONS[unit.currentWeaponId];
        const weaponBonus = equippedWeapon ? unit.basePower * (equippedWeapon.powerMultiplier - 1) + (unit.basePower * 0.1 * (weaponLevel - 1)) : (unit.basePower * 0.1 * (weaponLevel - 1));
        const armorBonus = unit.basePower * 0.15 * (unit.armorLevel - 1);
        const totalPowerPerUnit = unit.basePower + weaponBonus + armorBonus;
        return total + unit.owned * totalPowerPerUnit;
    }, 0);
  }, [units]);

  const currentRank = useMemo(() => RANKS[currentRankIndex], [currentRankIndex]);
  const nextRank = useMemo(() => RANKS[currentRankIndex + 1], [currentRankIndex]);

  const incomePerSecond = useMemo(() => {
    const income: Resources = { gold: 0, steel: 0, oil: 0 };
    
    // Base income
    income.gold = (income.gold ?? 0) + 10;
    
    // Rank bonus
    income.gold = (income.gold ?? 0) + currentRank.incomeBonus * (units.reduce((acc, u) => acc + u.owned, 0) > 0 ? 1 : 0);

    // Generator income
    generators.forEach(gen => {
        for (const [resource, value] of Object.entries(gen.production)) {
            // FIX: Ensure value is a number before arithmetic operation.
            income[resource as ResourceType] = (income[resource as ResourceType] ?? 0) + (Number(value) || 0) * gen.owned;
        }
    });

    return income;
  }, [currentRank, units, generators]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      setResources(prev => {
        const newRes = {...prev};
        for (const [res, income] of Object.entries(incomePerSecond)) {
            // FIX: Ensure value is a number before arithmetic operation.
            newRes[res as ResourceType] = (newRes[res as ResourceType] ?? 0) + (Number(income) || 0) / 10;
        }
        return newRes;
      });
    }, 100);

    return () => clearInterval(gameLoop);
  }, [incomePerSecond]);

  const canAfford = (cost: Resources, amount: number = 1): boolean => {
      return Object.entries(cost).every(([resource, value]) => {
          // FIX: Ensure value is a number before arithmetic operation.
          return (resources[resource as ResourceType] ?? 0) >= (Number(value) || 0) * amount;
      });
  };

  const handlePurchaseUnit = useCallback((unitId: string, amount: PurchaseAmount) => {
    setUnits(prevUnits => {
        const unitIndex = prevUnits.findIndex(u => u.id === unitId);
        if (unitIndex === -1) return prevUnits;

        const unit = { ...prevUnits[unitIndex] };
        let numToBuy = 0;
        
        if (amount === 'MAX') {
            let max = Infinity;
            for (const [resource, value] of Object.entries(unit.cost)) {
                if (typeof value === 'number' && value > 0) {
                    max = Math.min(max, Math.floor((resources[resource as ResourceType] ?? 0) / value));
                }
            }
            numToBuy = max === Infinity ? 0 : max;
        } else {
            numToBuy = amount;
        }

        const totalCost: Resources = {};
        for(const [res, val] of Object.entries(unit.cost)) {
            // FIX: Ensure value is a number before arithmetic operation.
            totalCost[res as ResourceType] = (Number(val) || 0) * numToBuy;
        }

        if (canAfford(totalCost) && numToBuy > 0) {
            setResources(prevRes => {
                const newRes = {...prevRes};
                for(const [res, val] of Object.entries(totalCost)) {
                    // FIX: Ensure value is a number before arithmetic operation.
                    newRes[res as ResourceType] = (newRes[res as ResourceType] ?? 0) - (Number(val) || 0);
                }
                return newRes;
            });
            const newUnits = [...prevUnits];
            newUnits[unitIndex] = { ...unit, owned: unit.owned + numToBuy };
            return newUnits;
        }
        return prevUnits;
    });
  }, [resources]);

  const handlePurchaseGenerator = useCallback((generatorId: string, amount: PurchaseAmount) => {
      setGenerators(prevGens => {
          const genIndex = prevGens.findIndex(g => g.id === generatorId);
          if (genIndex === -1) return prevGens;

          const generator = { ...prevGens[genIndex] };
          let numToBuy = 0;

           if (amount === 'MAX') {
              let max = Infinity;
              for (const [resource, value] of Object.entries(generator.cost)) {
                  if (typeof value === 'number' && value > 0) {
                      max = Math.min(max, Math.floor((resources[resource as ResourceType] ?? 0) / value));
                  }
              }
              numToBuy = max === Infinity ? 0 : max;
          } else {
              numToBuy = amount;
          }

          const totalCost: Resources = {};
          for(const [res, val] of Object.entries(generator.cost)) {
              // FIX: Ensure value is a number before arithmetic operation.
              totalCost[res as ResourceType] = (Number(val) || 0) * numToBuy;
          }
          
          if (canAfford(totalCost) && numToBuy > 0) {
              setResources(prevRes => {
                  const newRes = {...prevRes};
                  for(const [res, val] of Object.entries(totalCost)) {
                      // FIX: Ensure value is a number before arithmetic operation.
                      newRes[res as ResourceType] = (newRes[res as ResourceType] ?? 0) - (Number(val) || 0);
                  }
                  return newRes;
              });
              const newGens = [...prevGens];
              newGens[genIndex] = { ...generator, owned: generator.owned + numToBuy };
              return newGens;
          }
          return prevGens;
      });
  }, [resources]);

  const handleUpgradeUnit = useCallback((unitId: string, upgradeType: 'weapon' | 'armor') => {
      setUnits(prevUnits => {
          const unitIndex = prevUnits.findIndex(u => u.id === unitId);
          if (unitIndex === -1) return prevUnits;

          const unit = { ...prevUnits[unitIndex] };
          const level = upgradeType === 'weapon' ? (unit.weaponLevels[unit.currentWeaponId] || 1) : unit.armorLevel;
          
          const multiplier = Math.pow(1.5, level - 1);
          const upgradeCost: Resources = {};
          for (const [res, val] of Object.entries(unit.upgradeCostBase)) {
              // FIX: Ensure value is a number before arithmetic operation.
              upgradeCost[res as ResourceType] = Math.floor((Number(val) || 0) * multiplier);
          }

          if (canAfford(upgradeCost)) {
              setResources(prevRes => {
                  const newRes = {...prevRes};
                  for(const [res, val] of Object.entries(upgradeCost)) {
                      // FIX: Ensure value is a number before arithmetic operation.
                      newRes[res as ResourceType] = (newRes[res as ResourceType] ?? 0) - (Number(val) || 0);
                  }
                  return newRes;
              });

              if (upgradeType === 'weapon') {
                unit.weaponLevels = {
                    ...unit.weaponLevels,
                    [unit.currentWeaponId]: (unit.weaponLevels[unit.currentWeaponId] || 1) + 1,
                };
              }
              else unit.armorLevel++;

              const newUnits = [...prevUnits];
              newUnits[unitIndex] = unit;
              setCustomizingUnit(unit); // Update the modal view
              return newUnits;
          }
          return prevUnits;
      });
  }, [resources]);


  useEffect(() => {
    if (nextRank && militaryPower >= nextRank.powerRequired) {
      setCurrentRankIndex(prev => prev + 1);
      setShowRankUpModal(true);
    }
  }, [militaryPower, nextRank]);

  const fetchAdvisorResponse = async () => {
    setIsAdvisorLoading(true);
    setShowAdvisorModal(true);
    setAdvisorResponse('');
    try {
      const advice = await getAdvice({
        resources: {
            gold: formatNumber(resources.gold ?? 0),
            steel: formatNumber(resources.steel ?? 0),
            oil: formatNumber(resources.oil ?? 0),
        },
        incomePerSecond: {
            gold: formatNumber(incomePerSecond.gold ?? 0),
            steel: formatNumber(incomePerSecond.steel ?? 0),
            oil: formatNumber(incomePerSecond.oil ?? 0),
        },
        militaryPower: formatNumber(militaryPower),
        currentRank: currentRank.name,
        nextRank: nextRank?.name || 'MAX',
        nextRankPower: nextRank ? formatNumber(nextRank.powerRequired) : 'N/A',
        units: units.filter(u => u.owned > 0).map(u => ({ name: u.name, owned: u.owned, equippedWeapon: WEAPONS[u.currentWeaponId].name, weaponLvl: u.weaponLevels[u.currentWeaponId] || 1, armorLvl: u.armorLevel })),
        generators: generators.filter(g => g.owned > 0).map(g => ({ name: g.name, owned: g.owned })),
        // FIX: Added craftedWeaponIds to the getAdvice call to match the updated GameState type in geminiService.
        // FIX: Cast `w` to `Weapon` to resolve type inference issue with Object.values.
        craftedWeaponIds: Object.values(WEAPONS).filter(w => Object.keys((w as Weapon).craftingCost).length === 0).map(w => (w as Weapon).id),
      });
      setAdvisorResponse(advice);
    } catch (error) {
      console.error("Error getting advice:", error);
      setAdvisorResponse("I seem to be out of commission. Please try again later, soldier.");
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const visibleUnits = useMemo(() => units.filter(unit => unit.requiredRank <= currentRankIndex), [units, currentRankIndex]);

  const progressPercentage = useMemo(() => {
    if (!nextRank) return 100;
    const prevRankPower = currentRank.powerRequired;
    const powerInRange = militaryPower - prevRankPower;
    const totalRange = nextRank.powerRequired - prevRankPower;
    return (powerInRange / totalRange) * 100;
  }, [militaryPower, currentRank, nextRank]);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center p-4 selection:bg-primary/30">
      <Header
        resources={resources}
        militaryPower={militaryPower}
        incomePerSecond={incomePerSecond}
        currentRank={currentRank}
        formatNumber={formatNumber}
      />

      <main className="w-full max-w-7xl mt-4 flex-grow">
        <div className="bg-base-200/50 p-4 rounded-lg shadow-xl mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-secondary">Next Rank: {nextRank ? nextRank.name : 'Highest Rank Reached'}</h2>
            {nextRank && <span className="text-sm font-medium">{formatNumber(militaryPower)} / {formatNumber(nextRank.powerRequired)} Power</span>}
          </div>
          <ProgressBar percentage={progressPercentage} />
        </div>

        <h2 className="text-2xl font-bold text-gray-300 mb-3 pl-1">Military Units</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleUnits.map(unit => (
            <UnitCard
              key={unit.id}
              unit={unit}
              resources={resources}
              onPurchase={handlePurchaseUnit}
              onCustomize={setCustomizingUnit}
              formatNumber={formatNumber}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-300 mt-8 mb-3 pl-1">Resource Generators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generators.map(gen => (
                <GeneratorCard
                    key={gen.id}
                    generator={gen}
                    resources={resources}
                    onPurchase={handlePurchaseGenerator}
                    formatNumber={formatNumber}
                />
            ))}
        </div>
      </main>
      
      {showRankUpModal && nextRank && (
        <RankUpModal
          newRank={currentRank}
          onClose={() => setShowRankUpModal(false)}
        />
      )}
      
      {showAdvisorModal && (
        <AdvisorModal
          isOpen={showAdvisorModal}
          onClose={() => setShowAdvisorModal(false)}
          advice={advisorResponse}
          isLoading={isAdvisorLoading}
        />
      )}

      {customizingUnit && (
          <CustomizationModal
            unit={customizingUnit}
            resources={resources}
            onClose={() => setCustomizingUnit(null)}
            onUpgradeWeapon={(unitId, weaponId) => {}}
            onUnlockWeapon={(unitId, weaponId) => {}}
            onSwitchWeapon={(unitId, weaponId) => {}}
            onUpgradeArmor={(unitId) => {}}
            craftedWeaponIds={[]}
            formatNumber={formatNumber}
          />
      )}
      
      <button
        onClick={fetchAdvisorResponse}
        className="fixed bottom-4 right-4 bg-primary hover:bg-sky-500 text-white font-bold p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-primary z-50"
        aria-label="Get AI Strategy Advice"
      >
        <BrainCircuitIcon className="w-8 h-8"/>
      </button>

    </div>
  );
};

export default App;
