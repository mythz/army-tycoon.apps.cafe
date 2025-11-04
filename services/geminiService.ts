
import { GoogleGenAI } from "@google/genai";
import { INITIAL_UNITS, WEAPONS } from "../constants";

interface GameState {
  resources: { gold: string; steel: string; oil: string; ammo: string; wheat: string; };
  militaryPower: string;
  incomePerSecond: { gold: string; steel: string; oil: string; ammo: string; wheat: string; };
  wheatConsumptionPerSecond: string;
  isStarving: boolean;
  currentRank: string;
  nextRank: string;
  nextRankPower: string;
  units: { name: string; owned: number; rank: string; equippedWeapon: string; weaponLvl: number; armorLvl: number }[];
  generators: { name: string; owned: number }[];
  craftedWeaponIds: string[];
  craftedUnitIds: string[];
  currentEnemyName: string;
  currentEnemyPower: string;
}

// Ensure API_KEY is available in the environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set" + apiKey);
}

const ai = new GoogleGenAI({ apiKey });

export const getAdvice = async (gameState: GameState): Promise<string> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `You are a top-tier military strategy advisor for an army tycoon game. 
Your advice should be tactical, encouraging, and easy to understand.
Analyze the player's current situation and provide a clear recommendation on what to do next.
Consider their resource income, military power, unit veterancy ranks, unit upgrades, equipped weapons, crafted blueprints (for both weapons and vehicles), and the current enemy they face.
Also be aware of the new logistics system:
- All units consume Wheat. The total consumption is provided.
- If Wheat runs out, the army starts starving, and its military power is HALVED. This is a critical situation to avoid.
- The player can build Farmland to produce more Wheat.
- The player can also scavenge resources, ammo, weapon blueprints, and hostages from victorious battles.
- Battles cost a fixed amount of ammo. The player can build Ammo Factories to produce more.
Based on this information, provide a concise strategic recommendation. Focus on the best unit to purchase, generator to build, weapon or vehicle to craft, unit/weapon to upgrade, or if they are ready to battle the current enemy. Prioritize solving starvation if it's happening. Keep the tone of a seasoned general addressing a promising commander. Your response should be a few short paragraphs.`;

  const userPrompt = `
Current Status:
- Resources: 
  - Gold: ${gameState.resources.gold} (+${gameState.incomePerSecond.gold}/s)
  - Wheat: ${gameState.resources.wheat} (${gameState.isStarving ? 'STARVING' : `+${gameState.incomePerSecond.wheat}/s, -${gameState.wheatConsumptionPerSecond}/s`})
  - Steel: ${gameState.resources.steel} (+${gameState.incomePerSecond.steel}/s)
  - Oil: ${gameState.resources.oil} (+${gameState.incomePerSecond.oil}/s)
  - Ammo: ${gameState.resources.ammo} (+${gameState.incomePerSecond.ammo}/s)
- Military Power: ${gameState.militaryPower} ${gameState.isStarving ? '(HALVED DUE TO STARVATION)' : ''}
- Current Rank: ${gameState.currentRank}
- Next Rank: ${gameState.nextRank} (Requires ${gameState.nextRankPower} Power)

Current Enemy Target:
- ${gameState.currentEnemyName} (Power: ${gameState.currentEnemyPower})

Crafted Weapon Blueprints:
${gameState.craftedWeaponIds.map(id => `- ${WEAPONS[id]?.name || 'Unknown Weapon'}`).join('\n')}

Crafted Vehicle Blueprints:
${gameState.craftedUnitIds.map(id => `- ${INITIAL_UNITS.find(u => u.id === id)?.name || 'Unknown Unit'}`).join('\n')}

Owned Generators:
${gameState.generators.length > 0 ? gameState.generators.map(g => `- ${g.name}: ${g.owned}`).join('\n') : '- None'}

Owned Units:
${gameState.units.length > 0 ? gameState.units.map(u => `- ${u.name}: ${u.owned} (Rank: ${u.rank}, WPN: ${u.equippedWeapon} Lvl ${u.weaponLvl}, ARM Lvl ${u.armorLvl})`).join('\n') : '- None'}
`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
        },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "Commander, my communications are scrambled. I can't provide advice right now. Hold the line and we'll try again later.";
  }
};