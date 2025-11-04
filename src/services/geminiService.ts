
import { GoogleGenAI } from "@google/genai";
import { WEAPONS } from "../constants";

interface GameState {
  resources: { gold: string; steel: string; oil: string };
  militaryPower: string;
  incomePerSecond: { gold: string; steel: string; oil: string };
  currentRank: string;
  nextRank: string;
  nextRankPower: string;
  units: { name: string; owned: number; equippedWeapon: string; weaponLvl: number; armorLvl: number }[];
  generators: { name: string; owned: number }[];
  craftedWeaponIds: string[];
  currentEnemyName?: string; // Making optional as older App version doesn't send it
  currentEnemyPower?: string; // Making optional as older App version doesn't send it
}

// Ensure API_KEY is available in the environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

export const getAdvice = async (gameState: GameState): Promise<string> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `You are a top-tier military strategy advisor for an army tycoon game. 
Your advice should be tactical, encouraging, and easy to understand.
Analyze the player's current situation and provide a clear recommendation on what to do next.
Consider their resource income, military power, unit upgrades, equipped weapons, crafted blueprints, and the current enemy they face.
Based on this information, provide a concise strategic recommendation. Focus on the best unit to purchase, generator to build, weapon to craft, unit/weapon to upgrade, or if they are ready to battle the current enemy. Keep the tone of a seasoned general addressing a promising commander. Your response should be a few short paragraphs.`;

  const userPrompt = `
Current Status:
- Resources: 
  - Gold: ${gameState.resources.gold} (+${gameState.incomePerSecond.gold}/s)
  - Steel: ${gameState.resources.steel} (+${gameState.incomePerSecond.steel}/s)
  - Oil: ${gameState.resources.oil} (+${gameState.incomePerSecond.oil}/s)
- Military Power: ${gameState.militaryPower}
- Current Rank: ${gameState.currentRank}
- Next Rank: ${gameState.nextRank} (Requires ${gameState.nextRankPower} Power)

${gameState.currentEnemyName && gameState.currentEnemyPower ? `Current Enemy Target:
- ${gameState.currentEnemyName} (Power: ${gameState.currentEnemyPower})` : ''}

Crafted Weapon Blueprints:
${gameState.craftedWeaponIds.map(id => `- ${WEAPONS[id]?.name || 'Unknown Weapon'}`).join('\n')}

Owned Generators:
${gameState.generators.length > 0 ? gameState.generators.map(g => `- ${g.name}: ${g.owned}`).join('\n') : '- None'}

Owned Units:
${gameState.units.length > 0 ? gameState.units.map(u => `- ${u.name}: ${u.owned} (WPN: ${u.equippedWeapon} Lvl ${u.weaponLvl}, ARM Lvl ${u.armorLvl})`).join('\n') : '- None'}
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
