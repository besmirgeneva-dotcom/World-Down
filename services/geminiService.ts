import { GoogleGenAI } from "@google/genai";
import { Country, GameEvent } from "../types";

// Helper robuste pour récupérer la clé API
const getApiKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return undefined;
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API_KEY is missing.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- OPTIMIZATION: SHORT CODES ---
const COUNTRY_ALIASES: Record<string, string> = {
  "United States of America": "USA", "United Kingdom": "UK", "Russia": "RUS",
  "China": "CHN", "Germany": "DEU", "France": "FRA", "India": "IND",
  "Japan": "JPN", "Brazil": "BRA", "Israel": "ISR", "Iran": "IRN",
  "North Korea": "PRK", "South Korea": "KOR", "Taiwan": "TWN",
  "Canada": "CAN", "Australia": "AUS"
};

const getFullName = (code: string): string | undefined => {
  const entry = Object.entries(COUNTRY_ALIASES).find(([name, alias]) => alias === code);
  return entry ? entry[0] : undefined;
};

const getShortCode = (name: string): string => {
  if (COUNTRY_ALIASES[name]) return COUNTRY_ALIASES[name];
  return name.substring(0, 3).toUpperCase();
};

// --- ENGINE: HYBRID LOGIC ---

// Calcul Local (Moteur mathématique simple)
const calculatePassiveGrowth = (country: Country): Partial<Country['stats']> => {
  if (country.isDestroyed) return {};

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Économie fluctue légèrement (-2 à +3)
  let newEco = country.stats.economy + rand(-2, 3);
  // Population croît doucement (0 à +1) sauf si économie critique
  let newPop = country.stats.population + (country.stats.economy > 40 ? rand(0, 1) : rand(-1, 0));
  // Militaire stable ou légère baisse (maintenance)
  let newMil = country.stats.military + rand(-1, 1);

  // Bornes 0-100
  return {
    economy: Math.max(0, Math.min(100, newEco)),
    military: Math.max(0, Math.min(100, newMil)),
    population: Math.max(0, Math.min(100, newPop))
  };
};

const getRelevantCountries = (countries: Country[], playerActions: string[]): Country[] => {
  const MAJOR_POWERS = ["USA", "CHN", "RUS", "DEU", "FRA"]; // Réduit au strict minimum
  const actionsText = playerActions.join(" ").toLowerCase();

  return countries.filter(c => {
    const code = getShortCode(c.name);
    // On garde les pays impliqués dans l'action OU les majeurs
    // Les autres seront gérés par le moteur local
    if (actionsText.includes(c.name.toLowerCase())) return true;
    if (MAJOR_POWERS.includes(code)) return true;
    if (c.stats.hasNuclear && c.stats.military > 90) return true; // Menaces actives
    return false;
  });
};

const serializeWorldState = (countries: Country[]) => {
  return countries.map(c => {
    let flags = "";
    if (c.stats.hasNuclear) flags += 'N';
    if (c.isDestroyed) flags += 'D';
    if (c.ownerId && c.ownerId !== c.name) flags += `>${getShortCode(c.ownerId)}`;
    
    const e = Math.floor(c.stats.economy);
    const m = Math.floor(c.stats.military);
    const p = Math.floor(c.stats.population);
    
    return `${getShortCode(c.name)}|${e}|${m}|${p}|${flags}`;
  }).join(' ');
};

const serializeEvents = (events: GameEvent[]) => {
  // OPTIMISATION: Fenêtre glissante stricte (5 derniers tours max)
  return events.slice(-5).map(e => `T${e.turn}:${e.description.substring(0, 30)}`).join('|');
};

// --- MAIN SIMULATION ---

export const simulateTurn = async (
  currentTurn: number,
  countries: Country[],
  playerActions: string[],
  recentEvents: GameEvent[]
): Promise<{ events: string[], statUpdates: Record<string, Partial<Country['stats']>>, tokenUsage: number }> => {
  
  // Note: On a supprimé le "Lazy Mode" (Marchés stables) car le jeu impose maintenant au moins une action.
  // On utilise toujours Gemini pour générer une réponse narrative intéressante.

  let ai;
  try {
    ai = getAI();
  } catch (e) {
    return { events: ["ERREUR API"], statUpdates: {}, tokenUsage: 0 };
  }

  // STRATEGIE 1: HYBRID ENGINE
  // On n'envoie à l'IA que les pays pertinents pour économiser le contexte
  const relevantCountries = getRelevantCountries(countries, playerActions);
  
  // Les pays NON pertinents sont calculés localement
  const passiveUpdates: Record<string, Partial<Country['stats']>> = {};
  countries.forEach(c => {
    if (!relevantCountries.find(r => r.name === c.name)) {
      passiveUpdates[c.name] = calculatePassiveGrowth(c);
    }
  });

  const worldState = serializeWorldState(relevantCountries);
  const history = serializeEvents(recentEvents);
  // playerActions ne devrait jamais être vide ici, mais safety check
  const actions = playerActions.length > 0 ? playerActions.join(".") : "Wait";

  // STRATEGIE 3: SYSTEM INSTRUCTION (Caching Ready)
  // Les règles statiques vont dans le systemInstruction
  const systemInstruction = `
ROLE:Game Engine. LANG:FR.
RULES:
1.React to ACT based on HIST.
2.If War/Attack -> High Impact.
3.Eco/Mil/Pop 0-100.
4.Flg: N=Nuke, D=Dead, >COD=Owned.
FORMAT OUT:
#E
- Event (Short)
#U
COD:Eco:Mil:Pop
`;

  const prompt = `
CTX:T:${currentTurn}
STATE:${worldState}
HIST:${history}
ACT:${actions}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 200, // Limite stricte pour forcer la concision
      }
    });

    const text = response.text || "";
    const tokenUsage = response.usageMetadata?.totalTokenCount || 0;

    const events: string[] = [];
    const aiUpdates: Record<string, Partial<Country['stats']>> = {};

    const parts = text.split('#');
    
    parts.forEach(part => {
        const type = part.charAt(0);
        const content = part.substring(1).trim();

        if (type === 'E') {
            content.split('\n').forEach(line => {
                const clean = line.replace(/^-\s*/, '').trim();
                if (clean.length > 3) events.push(clean);
            });
        }
        else if (type === 'U') {
            content.split('\n').forEach(line => {
                const segs = line.trim().split(':');
                if (segs.length >= 4) {
                    const p = parseInt(segs.pop() || "0");
                    const m = parseInt(segs.pop() || "0");
                    const e = parseInt(segs.pop() || "0");
                    const code = segs[0].trim();
                    const fullName = getFullName(code) || (countries.find(c => c.name.startsWith(code))?.name);

                    if (fullName && !isNaN(e)) {
                        aiUpdates[fullName] = { economy: e, military: m, population: p };
                    }
                }
            });
        }
    });

    if (events.length === 0) events.push("Tensions géopolitiques.");

    // MERGE: On combine les mises à jour IA (prioritaires) avec les mises à jour passives locales
    const finalUpdates = { ...passiveUpdates, ...aiUpdates };

    return {
        events,
        statUpdates: finalUpdates,
        tokenUsage
    };

  } catch (error) {
    console.error("Sim Error:", error);
    return {
      events: ["Com Interrompue."],
      statUpdates: {},
      tokenUsage: 0
    };
  }
};