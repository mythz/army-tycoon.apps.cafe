
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Unit, Rank, PurchaseAmount, Resources, ResourceType, ResourceGenerator, Enemy, ScavengeRewards } from './types';
import { INITIAL_UNITS, RANKS, RESOURCE_GENERATORS, WEAPONS, ENEMIES, UNIT_RANKS } from './constants';
import Header from './components/Header';
import UnitCard from './components/UnitCard';
import GeneratorCard from './components/GeneratorCard';
import ProgressBar from './components/ProgressBar';
import RankUpModal from './components/RankUpModal';
import AdvisorModal from './components/AdvisorModal';
import CustomizationModal from './components/CustomizationModal';
import ArmoryModal from './components/ArmoryModal';
import BattleCard from './components/BattleCard';
import BattleResultModal from './components/BattleResultModal';
import ScavengeModal from './components/ScavengeModal';
import GameOverModal from './components/GameOverModal';
import BattleAnimationModal from './components/BattleAnimationModal';
import { getAdvice } from './services/geminiService';
import { BrainCircuitIcon, HammerIcon } from './components/icons';
import { playVictorySound, playDefeatSound } from './utils/audio';

type BattleResult = {
    outcome: 'victory' | 'defeat';
    rewards?: Resources;
    penalties?: Resources;
}

type ScavengeResult = ScavengeRewards & {
  foundBlueprintId?: string;
}

type BattleAnimationData = {
    playerPower: number;
    enemy: Enemy;
}

const RANSOM_GOLD_PER_HOSTAGE = 1000;
const BATTLE_AMMO_COST = 1000;
const WHEAT_PER_PERSON_PER_SECOND = 0.1;
const STARVATION_TIMER_SECONDS = 300; // 5 minutes

const formatNumber = (num: number): string => {
  if (num < 1e3) return num.toFixed(0);
  if (num < 1e6) return `${(num / 1e3).toFixed(2)}K`;
  if (num < 1e9) return `${(num / 1e6).toFixed(2)}M`;
  if (num < 1e12) return `${(num / 1e9).toFixed(2)}B`;
  if (num < 1e15) return `${(num / 1e12).toFixed(2)}T`;
  return `>${(num / 1e15).toExponential(2)}`;
};

const App: React.FC = () => {
  const [resources, setResources] = useState<Resources>({ gold: 100, steel: 0, oil: 0, ammo: 2000, wheat: 500 });
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [generators, setGenerators] = useState<ResourceGenerator[]>(RESOURCE_GENERATORS);
  const [currentRankIndex, setCurrentRankIndex] = useState<number>(0);
  const [showRankUpModal, setShowRankUpModal] = useState<boolean>(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState<boolean>(false);
  const [showArmoryModal, setShowArmoryModal] = useState<boolean>(false);
  const [customizingUnit, setCustomizingUnit] = useState<Unit | null>(null);
  const [advisorResponse, setAdvisorResponse] = useState<string>('');
  const [isAdvisorLoading, setIsAdvisorLoading] = useState<boolean>(false);
  const [isStarving, setIsStarving] = useState<boolean>(false);
  const [starvationTimer, setStarvationTimer] = useState(STARVATION_TIMER_SECONDS);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<'ammo' | 'starvation' | null>(null);

  const [craftedWeaponIds, setCraftedWeaponIds] = useState<string[]>(
    Object.values(WEAPONS).filter(w => Object.keys(w.craftingCost).length === 0).map(w => w.id)
  );
  const [craftedUnitIds, setCraftedUnitIds] = useState<string[]>(
    INITIAL_UNITS.filter(u => Object.keys(u.craftingCost).length === 0).map(u => u.id)
  );
  const [unlockedGeneratorIds, setUnlockedGeneratorIds] = useState<string[]>(['farmland', 'gold_mine', 'steel_mill', 'oil_refinery']);
  const [hasFoughtFirstBattle, setHasFoughtFirstBattle] = useState<boolean>(false);
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [scavengeResult, setScavengeResult] = useState<ScavengeResult | null>(null);
  const [isBattleAnimating, setIsBattleAnimating] = useState<boolean>(false);
  const [battleAnimationData, setBattleAnimationData] = useState<BattleAnimationData | null>(null);


  const baseMilitaryPower = useMemo(() => {
    return units.reduce((total, unit) => {
        const equippedWeapon = WEAPONS[unit.currentWeaponId];
        const weaponLevel = unit.weaponLevels[unit.currentWeaponId] || 1;
        const weaponBonus = unit.basePower * (equippedWeapon.powerMultiplier - 1) + (unit.basePower * 0.1 * (weaponLevel - 1));
        const armorBonus = unit.basePower * 0.15 * (unit.armorLevel - 1);
        const rankBonusMultiplier = UNIT_RANKS[unit.veterancyRank]?.powerBonusMultiplier || 1.0;
        const totalPowerPerUnit = (unit.basePower + weaponBonus + armorBonus) * rankBonusMultiplier;
        return total + unit.owned * totalPowerPerUnit;
    }, 0);
  }, [units]);

  const militaryPower = useMemo(() => {
    return isStarving ? baseMilitaryPower * 0.5 : baseMilitaryPower;
  }, [baseMilitaryPower, isStarving]);

  const currentRank = useMemo(() => RANKS[currentRankIndex], [currentRankIndex]);
  const nextRank = useMemo(() => RANKS[currentRankIndex + 1], [currentRankIndex]);
  const currentEnemy = useMemo(() => ENEMIES[currentEnemyIndex] || null, [currentEnemyIndex]);
  
  const totalCrew = useMemo(() => {
    return units.reduce((acc, unit) => acc + (unit.owned * unit.crew), 0);
  }, [units]);

  const incomePerSecond = useMemo(() => {
    const income: Resources = { gold: 0, steel: 0, oil: 0, ammo: 0, wheat: 0 };
    
    income.gold = (Number(income.gold) || 0) + 10;
    income.gold = (Number(income.gold) || 0) + currentRank.incomeBonus * (units.reduce((acc, u) => acc + u.owned, 0) > 0 ? 1 : 0);

    generators.forEach(gen => {
        for (const [resource, value] of Object.entries(gen.production)) {
            income[resource as ResourceType] = (Number(income[resource as ResourceType]) || 0) + (Number(value) || 0) * gen.owned;
        }
    });
    
    // Wheat is special as it's also consumed
    const wheatConsumption = totalCrew * WHEAT_PER_PERSON_PER_SECOND;
    income.wheat = (Number(income.wheat) || 0) - wheatConsumption;

    return income;
  }, [currentRank, units, generators, totalCrew]);

  const handleRestart = useCallback(() => {
    setResources({ gold: 100, steel: 0, oil: 0, ammo: 2000, wheat: 500 });
    setUnits(INITIAL_UNITS);
    setGenerators(RESOURCE_GENERATORS);
    setCurrentRankIndex(0);
    setShowRankUpModal(false);
    setShowAdvisorModal(false);
    setShowArmoryModal(false);
    setCustomizingUnit(null);
    setAdvisorResponse('');
    setIsAdvisorLoading(false);
    setIsStarving(false);
    setStarvationTimer(STARVATION_TIMER_SECONDS);
    setCraftedWeaponIds(
        Object.values(WEAPONS).filter(w => Object.keys(w.craftingCost).length === 0).map(w => w.id)
    );
    setCraftedUnitIds(
        INITIAL_UNITS.filter(u => Object.keys(u.craftingCost).length === 0).map(u => u.id)
    );
    setUnlockedGeneratorIds(['farmland', 'gold_mine', 'steel_mill', 'oil_refinery']);
    setHasFoughtFirstBattle(false);
    setCurrentEnemyIndex(0);
    setBattleResult(null);
    setShowBattleModal(false);
    setScavengeResult(null);
    setIsGameOver(false);
    setGameOverReason(null);
    setIsBattleAnimating(false);
    setBattleAnimationData(null);
  }, []);

  // Main game loop for resource updates
  useEffect(() => {
    if (isGameOver || isBattleAnimating) return;

    const gameLoop = setInterval(() => {
      setResources(prevRes => {
        const newRes = { ...prevRes };
        // Apply income/consumption for all resources
        for (const [res, income] of Object.entries(incomePerSecond)) {
            newRes[res as ResourceType] = Math.max(0, (Number(newRes[res as ResourceType]) || 0) + (Number(income) || 0) / 10);
        }
        return newRes;
      });
    }, 100);

    return () => clearInterval(gameLoop);
  }, [incomePerSecond, isGameOver, isBattleAnimating]);

  // Effect to check for starvation and ammo game over conditions
  useEffect(() => {
    if (isGameOver) return;
    
    // Starvation check
    const currentlyStarving = (resources.wheat ?? 0) <= 0 && totalCrew > 0;
    if (currentlyStarving !== isStarving) {
      setIsStarving(currentlyStarving);
    }

    // Ammo check
    const ammoFactory = generators.find(g => g.id === 'ammo_factory');
    const hasAmmoProduction = ammoFactory && ammoFactory.owned > 0;
    if ((resources.ammo ?? 0) <= 0 && !hasAmmoProduction) {
      setGameOverReason('ammo');
      setIsGameOver(true);
    }
  }, [resources, totalCrew, generators, isStarving, isGameOver]);

  // Effect for the starvation timer
  useEffect(() => {
    if (!isStarving || isGameOver) {
      setStarvationTimer(STARVATION_TIMER_SECONDS);
      return;
    }

    const timerId = setInterval(() => {
      setStarvationTimer(prev => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          setGameOverReason('starvation');
          setIsGameOver(true);
          clearInterval(timerId);
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(timerId);
  }, [isStarving, isGameOver]);

  const canAfford = (cost: Resources, amount: number = 1): boolean => {
      return Object.entries(cost).every(([resource, value]) => {
          return (Number(resources[resource as ResourceType]) || 0) >= (Number(value) || 0) * amount;
      });
  };

  const deductResources = (cost: Resources) => {
    setResources(prevRes => {
        const newRes = {...prevRes};
        for(const [res, val] of Object.entries(cost)) {
            newRes[res as ResourceType] = (Number(newRes[res as ResourceType]) || 0) - (Number(val) || 0);
        }
        return newRes;
    });
  };

  const addResources = (gains: Resources) => {
    setResources(prevRes => {
        const newRes = {...prevRes};
        for(const [res, val] of Object.entries(gains)) {
            newRes[res as ResourceType] = (Number(newRes[res as ResourceType]) || 0) + (Number(val) || 0);
        }
        return newRes;
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
                    max = Math.min(max, Math.floor((Number(resources[resource as ResourceType]) || 0) / value));
                }
            }
            numToBuy = max === Infinity ? 0 : max;
        } else {
            numToBuy = amount;
        }

        const totalCost: Resources = {};
        for(const [res, val] of Object.entries(unit.cost)) {
            totalCost[res as ResourceType] = (Number(val) || 0) * numToBuy;
        }

        if (canAfford(totalCost) && numToBuy > 0) {
            deductResources(totalCost);
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
                      max = Math.min(max, Math.floor((Number(resources[resource as ResourceType]) || 0) / value));
                  }
              }
              numToBuy = max === Infinity ? 0 : max;
          } else {
              numToBuy = amount;
          }

          const totalCost: Resources = {};
          for(const [res, val] of Object.entries(generator.cost)) {
              totalCost[res as ResourceType] = (Number(val) || 0) * numToBuy;
          }
          
          if (canAfford(totalCost) && numToBuy > 0) {
              deductResources(totalCost);
              const newGens = [...prevGens];
              newGens[genIndex] = { ...generator, owned: generator.owned + numToBuy };
              return newGens;
          }
          return prevGens;
      });
  }, [resources]);

  const updateUnit = (unitId: string, updates: Partial<Unit> | ((unit: Unit) => Unit)) => {
    setUnits(prevUnits => {
        const newUnits = [...prevUnits];
        const unitIndex = newUnits.findIndex(u => u.id === unitId);
        if (unitIndex !== -1) {
            const oldUnit = newUnits[unitIndex];
            newUnits[unitIndex] = typeof updates === 'function' ? updates(oldUnit) : { ...oldUnit, ...updates };
            if (customizingUnit?.id === unitId) {
                setCustomizingUnit(newUnits[unitIndex]);
            }
        }
        return newUnits;
    });
  };

  const handleUpgradeWeapon = useCallback((unitId: string, weaponId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;

    const level = unit.weaponLevels[weaponId] || 1;
    const multiplier = Math.pow(1.5, level - 1);
    const upgradeCost: Resources = {};
    for (const [res, val] of Object.entries(unit.upgradeCostBase)) {
        upgradeCost[res as ResourceType] = Math.floor((Number(val) || 0) * multiplier);
    }
    
    if (canAfford(upgradeCost)) {
        deductResources(upgradeCost);
        updateUnit(unitId, u => ({
            ...u,
            weaponLevels: {
                ...u.weaponLevels,
                [weaponId]: (u.weaponLevels[weaponId] || 1) + 1,
            },
        }));
    }
  }, [units, resources]);

  const handleUpgradeArmor = useCallback((unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;

    const level = unit.armorLevel;
    const multiplier = Math.pow(1.5, level - 1);
    const upgradeCost: Resources = {};
    for (const [res, val] of Object.entries(unit.upgradeCostBase)) {
        upgradeCost[res as ResourceType] = Math.floor((Number(val) || 0) * multiplier);
    }

    if (canAfford(upgradeCost)) {
        deductResources(upgradeCost);
        updateUnit(unitId, { armorLevel: unit.armorLevel + 1 });
    }
  }, [units, resources]);
  
  const handleUnlockWeapon = useCallback((unitId: string, weaponId: string) => {
    const unit = units.find(u => u.id === unitId);
    const weapon = WEAPONS[weaponId];
    if (!unit || !weapon || unit.unlockedWeaponIds.includes(weaponId)) return;

    if (canAfford(weapon.unlockCost)) {
        deductResources(weapon.unlockCost);
        updateUnit(unitId, u => ({
            ...u,
            unlockedWeaponIds: [...u.unlockedWeaponIds, weaponId],
        }));
    }
  }, [units, resources]);

  const handleSwitchWeapon = useCallback((unitId: string, weaponId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit || !unit.unlockedWeaponIds.includes(weaponId)) return;
    updateUnit(unitId, { currentWeaponId: weaponId });
  }, [units]);
  
  const handleCraftWeapon = useCallback((weaponId: string) => {
    const weapon = WEAPONS[weaponId];
    if (!weapon || craftedWeaponIds.includes(weaponId)) return;
    
    if (canAfford(weapon.craftingCost)) {
      deductResources(weapon.craftingCost);
      setCraftedWeaponIds(prev => [...prev, weaponId]);
    }
  }, [resources, craftedWeaponIds]);

  const handleCraftUnit = useCallback((unitId: string) => {
    const unit = INITIAL_UNITS.find(u => u.id === unitId);
    if (!unit || craftedUnitIds.includes(unitId)) return;
    
    if (canAfford(unit.craftingCost)) {
      deductResources(unit.craftingCost);
      setCraftedUnitIds(prev => [...prev, unitId]);
    }
  }, [resources, craftedUnitIds]);
  
  const resolveBattle = useCallback(() => {
    if (!battleAnimationData) return;

    const { playerPower: powerAtBattleStart, enemy: enemyForBattle } = battleAnimationData;
    
    const isFirstBattle = !hasFoughtFirstBattle;

    if (powerAtBattleStart >= enemyForBattle.militaryPower) {
        // Victory
        playVictorySound();
        if (isFirstBattle) {
            setUnlockedGeneratorIds(prev => [...prev, 'ammo_factory']);
        }

        const results: ScavengeResult = { ...enemyForBattle.scavengeRewards };
        
        addResources(results.resources);
        
        const potentialBlueprints = enemyForBattle.scavengeRewards.weaponBlueprintIds || [];
        if (potentialBlueprints.length > 0) {
            const foundBlueprintId = potentialBlueprints.find(id => !craftedWeaponIds.includes(id));
            if (foundBlueprintId) {
                setCraftedWeaponIds(prev => [...prev, foundBlueprintId]);
                results.foundBlueprintId = foundBlueprintId;
            }
        }
        
        const xpGained = enemyForBattle.xpReward;
        setUnits(prevUnits => prevUnits.map(u => {
            if (u.owned > 0) {
                const newXp = u.xp + xpGained;
                let newRankIndex = u.veterancyRank;
                let nextUnitRank = UNIT_RANKS[newRankIndex + 1];

                while (nextUnitRank && newXp >= nextUnitRank.xpRequired) {
                    newRankIndex++;
                    nextUnitRank = UNIT_RANKS[newRankIndex + 1];
                }
                return { ...u, xp: newXp, veterancyRank: newRankIndex };
            }
            return u;
        }));
        
        setScavengeResult(results);
        setCurrentEnemyIndex(prev => prev + 1);
    } else {
        // Defeat
        playDefeatSound();
        const penalties: Resources = {};
        setResources(currentResources => {
            for (const res in currentResources) {
                if (res !== 'ammo') {
                    penalties[res as ResourceType] = Math.floor((Number(currentResources[res as ResourceType]) || 0) * 0.10);
                }
            }
            deductResources(penalties);
            return currentResources;
        });

        setBattleResult({ outcome: 'defeat', penalties });
        setShowBattleModal(true);
    }
    
    if (isFirstBattle) {
        setHasFoughtFirstBattle(true);
    }

    setIsBattleAnimating(false);
    setBattleAnimationData(null);

  }, [battleAnimationData, craftedWeaponIds, hasFoughtFirstBattle]);


  const handleBattle = useCallback(() => {
    if (!currentEnemy || (resources.ammo ?? 0) < BATTLE_AMMO_COST) return;
    
    deductResources({ ammo: BATTLE_AMMO_COST });
    setBattleAnimationData({ playerPower: militaryPower, enemy: currentEnemy });
    setIsBattleAnimating(true);
    
  }, [militaryPower, currentEnemy, resources]);

  const handleRansom = useCallback((hostages: number) => {
    addResources({ gold: hostages * RANSOM_GOLD_PER_HOSTAGE });
    setScavengeResult(null);
  }, []);

  const handleConscript = useCallback((hostages: number) => {
    updateUnit('soldier', (u) => ({ ...u, owned: u.owned + hostages }));
    setScavengeResult(null);
  }, []);

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
      const wheatConsumptionPerSecond = totalCrew * WHEAT_PER_PERSON_PER_SECOND;
      const advice = await getAdvice({
        resources: {
            gold: formatNumber(Number(resources.gold) || 0),
            steel: formatNumber(Number(resources.steel) || 0),
            oil: formatNumber(Number(resources.oil) || 0),
            ammo: formatNumber(Number(resources.ammo) || 0),
            wheat: formatNumber(Number(resources.wheat) || 0),
        },
        incomePerSecond: {
            gold: formatNumber(Number(incomePerSecond.gold) || 0),
            steel: formatNumber(Number(incomePerSecond.steel) || 0),
            oil: formatNumber(Number(incomePerSecond.oil) || 0),
            ammo: formatNumber(Number(incomePerSecond.ammo) || 0),
            wheat: formatNumber(Number(incomePerSecond.wheat) || 0),
        },
        wheatConsumptionPerSecond: formatNumber(wheatConsumptionPerSecond),
        isStarving,
        militaryPower: formatNumber(militaryPower),
        currentRank: currentRank.name,
        nextRank: nextRank?.name || 'MAX',
        nextRankPower: nextRank ? formatNumber(nextRank.powerRequired) : 'N/A',
        units: units.filter(u => u.owned > 0).map(u => ({ 
            name: u.name, 
            owned: u.owned,
            rank: UNIT_RANKS[u.veterancyRank].name,
            equippedWeapon: WEAPONS[u.currentWeaponId].name,
            weaponLvl: u.weaponLevels[u.currentWeaponId] || 1, 
            armorLvl: u.armorLevel 
        })),
        generators: generators.filter(g => g.owned > 0).map(g => ({ name: g.name, owned: g.owned })),
        craftedWeaponIds: craftedWeaponIds,
        craftedUnitIds: craftedUnitIds,
        currentEnemyName: currentEnemy?.name || "None",
        currentEnemyPower: currentEnemy ? formatNumber(currentEnemy.militaryPower) : "N/A",
      });
      setAdvisorResponse(advice);
    } catch (error) {
      console.error("Error getting advice:", error);
      setAdvisorResponse("I seem to be out of commission. Please try again later, soldier.");
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const visibleUnits = useMemo(() => units.filter(unit => unit.requiredRank <= currentRankIndex && craftedUnitIds.includes(unit.id)), [units, currentRankIndex, craftedUnitIds]);
  
  const visibleGenerators = useMemo(() => generators.filter(gen => unlockedGeneratorIds.includes(gen.id)), [generators, unlockedGeneratorIds]);

  const progressPercentage = useMemo(() => {
    if (!nextRank) return 100;
    const prevRankPower = currentRank.powerRequired;
    const powerInRange = militaryPower - prevRankPower;
    const totalRange = nextRank.powerRequired - prevRankPower;
    return (powerInRange / totalRange) * 100;
  }, [militaryPower, currentRank, nextRank]);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center p-2 sm:p-4 selection:bg-primary/30">
      <Header
        resources={resources}
        militaryPower={militaryPower}
        incomePerSecond={incomePerSecond}
        currentRank={currentRank}
        formatNumber={formatNumber}
        isStarving={isStarving}
        starvationTimer={starvationTimer}
        totalCrew={totalCrew}
      />

      <main className="w-full max-w-7xl mt-4 flex-grow">
        <div className="bg-base-200/50 p-4 rounded-lg shadow-xl mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-secondary">Next Rank: {nextRank ? nextRank.name : 'Highest Rank Reached'}</h2>
            {nextRank && <span className="text-sm font-medium">{formatNumber(militaryPower)} / {formatNumber(nextRank.powerRequired)} Power</span>}
          </div>
          <ProgressBar percentage={progressPercentage} />
        </div>

        {currentEnemy && (
            <BattleCard
                enemy={currentEnemy}
                playerPower={militaryPower}
                playerAmmo={Number(resources.ammo) || 0}
                onBattle={handleBattle}
                formatNumber={formatNumber}
            />
        )}

        <div className="flex justify-between items-center mb-3 pl-1 mt-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-300">Military Units</h2>
            <button
                onClick={() => setShowArmoryModal(true)}
                className="flex items-center gap-2 bg-secondary/80 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 focus-visible:ring-secondary"
            >
                <HammerIcon className="w-5 h-5" />
                Armory
            </button>
        </div>
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

        <h2 className="text-xl sm:text-2xl font-bold text-gray-300 mt-8 mb-3 pl-1">Resource Generators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleGenerators.map(gen => (
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

      {showArmoryModal && (
        <ArmoryModal
          isOpen={showArmoryModal}
          onClose={() => setShowArmoryModal(false)}
          resources={resources}
          craftedWeaponIds={craftedWeaponIds}
          onCraftWeapon={handleCraftWeapon}
          craftedUnitIds={craftedUnitIds}
          onCraftUnit={handleCraftUnit}
          formatNumber={formatNumber}
        />
      )}

      {customizingUnit && (
          <CustomizationModal
            unit={customizingUnit}
            resources={resources}
            onClose={() => setCustomizingUnit(null)}
            onUpgradeWeapon={handleUpgradeWeapon}
            onUnlockWeapon={handleUnlockWeapon}
            onSwitchWeapon={handleSwitchWeapon}
            onUpgradeArmor={handleUpgradeArmor}
            craftedWeaponIds={craftedWeaponIds}
            formatNumber={formatNumber}
          />
      )}
      
       {showBattleModal && battleResult && (
        <BattleResultModal
          result={battleResult}
          onClose={() => {
            setShowBattleModal(false);
            setBattleResult(null);
          }}
          formatNumber={formatNumber}
        />
      )}

      {scavengeResult && (
        <ScavengeModal
            result={scavengeResult}
            onRansom={handleRansom}
            onConscript={handleConscript}
            onClose={() => setScavengeResult(null)}
            formatNumber={formatNumber}
        />
      )}

      {isBattleAnimating && battleAnimationData && (
        <BattleAnimationModal
            playerPower={battleAnimationData.playerPower}
            enemy={battleAnimationData.enemy}
            onAnimationComplete={resolveBattle}
        />
      )}

      {isGameOver && (
          <GameOverModal onRestart={handleRestart} reason={gameOverReason} />
      )}

      <button
        onClick={fetchAdvisorResponse}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-primary hover:bg-sky-500 text-white font-bold p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-primary z-50"
        aria-label="Get AI Strategy Advice"
      >
        <BrainCircuitIcon className="w-8 h-8"/>
      </button>

    </div>
  );
};

export default App;
