
export type ResourceType = 'gold' | 'steel' | 'oil' | 'ammo' | 'wheat';

export type Resources = {
  [key in ResourceType]?: number;
};

export interface Weapon {
  id: string;
  name: string;
  description: string;
  powerMultiplier: number; // e.g., 1.0 for standard, 1.2 for high-caliber
  craftingCost: Resources;
  unlockCost: Resources;
}

export interface UnitRank {
  name: string;
  xpRequired: number; // Cumulative XP needed to reach this rank
  powerBonusMultiplier: number; // e.g., 1.0 for rank 0, 1.1 for rank 1 (10% bonus)
}

export interface Unit {
  id: string;
  name: string;
  description: string;
  cost: Resources;
  craftingCost: Resources;
  basePower: number;
  owned: number;
  imageUrl: string;
  requiredRank: number;
  armorLevel: number;
  upgradeCostBase: Resources;
  // New weapon system properties
  availableWeaponIds: string[];
  unlockedWeaponIds: string[];
  currentWeaponId: string;
  weaponLevels: Record<string, number>; // e.g., { 'standard_rifle': 2, 'rapid_fire_rifle': 1 }
  // Veterancy properties
  veterancyRank: number; // index of UNIT_RANKS
  xp: number;
  // Food consumption
  crew: number;
}

export interface ResourceGenerator {
  id: string;
  name:string;
  description: string;
  cost: Resources;
  production: Resources;
  owned: number;
  imageUrl: string;
}

export interface Rank {
  name: string;
  powerRequired: number;
  incomeBonus: number; // This will now be a gold bonus
}

export interface ScavengeRewards {
  resources: Resources;
  weaponBlueprintIds?: string[]; // Potential blueprints to find
  hostages?: number;
}

export interface Enemy {
  id: string;
  name: string;
  description: string;
  militaryPower: number;
  scavengeRewards: ScavengeRewards;
  xpReward: number;
  imageUrl: string;
}

export type PurchaseAmount = 1 | 10 | 'MAX';