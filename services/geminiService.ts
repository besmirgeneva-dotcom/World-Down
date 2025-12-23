import { GoogleGenAI } from "@google/genai";
import { Country, GameEvent } from "../types";
import { decodeEvent } from "./narrativeEngine";

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

const getNameFromCodeOrName = (val: string, countries: Country[]) => {
    // Try to match short code first
    const full = getFullName(val);
    if (full) return full;
    // Try to match start of name
    const c = countries.find(c => c.name.toLowerCase().startsWith(val.toLowerCase()) || c.id.toLowerCase() === val.toLowerCase());
    return c ? c.name : val; 
}

// --- ENGINE: HYBRID LOGIC ---

// Calcul Local (Moteur mathématique simple) pour les pays passifs
const calculatePassiveGrowth = (country: Country): Partial<Country['stats']> => {
  if (country.isDestroyed) return {};

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const newEco = Math.max(0, Math.min(100, country.stats.economy + rand(-2, 3)));
  const newPop = Math.max(0, Math.min(100, country.stats.population + (country.stats.economy > 40 ? rand(0, 1) : rand(-1, 0))));
  const newMil = Math.max(0, Math.min(100, country.stats.military + rand(-1, 1)));

  return { economy: newEco, military: newMil, population: newPop };
};

const getRelevantCountries = (countries: Country[], playerActions: string[]): Country[] => {
  const MAJOR_POWERS = ["USA", "CHN", "RUS", "DEU", "FRA"];
  const actionsText = playerActions.join(" ").toLowerCase();

  return countries.filter(c => {
    const code = getShortCode(c.name);
    if (actionsText.includes(c.name.toLowerCase())) return true;
    if (MAJOR_POWERS.includes(code)) return true;
    if (c.stats.hasNuclear && c.stats.military > 90) return true;
    return false;
  });
};

const serializeWorldState = (countries: Country[]) => {
  return countries.map(c => {
    let flags = "";
    if (c.stats.hasNuclear) flags += 'N';
    if (c.isDestroyed) flags += 'D';
    if (c.ownerId && c.ownerId !== c.name) flags += `>${getShortCode(c.ownerId)}`;
    
    return `${getShortCode(c.name)}|${Math.floor(c.stats.economy)}|${Math.floor(c.stats.military)}|${Math.floor(c.stats.population)}|${flags}`;
  }).join(' ');
};

// --- FALLBACK GENERATOR (OFFLINE / FREE MODE) ---
// Utilise maintenant le NarrativeEngine pour générer du texte de qualité même sans IA
const generateFallbackLogic = (actions: string[], countries: Country[]) => {
    const events: string[] = [];
    
    actions.forEach(action => {
        const lower = action.toLowerCase();
        // Extraction basique des noms (très simplifiée pour le fallback)
        // On suppose que le nom du pays est au début ou mentionné
        const source = countries.find(c => lower.includes(c.name.toLowerCase()))?.name || "Une Nation";
        
        if (lower.includes("alliance")) {
            events.push(decodeEvent("ALLIANCE_NEW", source, "Coalition"));
        } else if (lower.includes("rejoint")) {
            events.push(decodeEvent("ALLIANCE_JOIN", source, "l'Alliance"));
        } else if (lower.includes("quitte")) {
            events.push(decodeEvent("ALLIANCE_LEAVE", source, "ses alliés"));
        } else if (lower.includes("annexé") || lower.includes("conquête")) {
            events.push(decodeEvent("WAR_WIN", source, "l'ennemi"));
        } else if (lower.includes("attaque")) {
            events.push(decodeEvent("GENERIC", source, "la cible"));
        } else if (lower.includes("nucléaire")) {
            events.push(decodeEvent("NUKE", source, "la cible"));
        } else if (lower.includes("blocus")) {
            events.push(decodeEvent("ECO_BLOCK", source, "la cible"));
        } else if (lower.includes("sabotage")) {
            events.push(decodeEvent("SABOTAGE", source, "la cible"));
        } else {
            events.push(decodeEvent("GENERIC", source, "le monde"));
        }
    });

    if (events.length === 0) events.push("Le calme règne avant la tempête. Les marchés observent la situation.");
    return events;
};

// --- MAIN SIMULATION ---

export const simulateTurn = async (
  currentTurn: number,
  countries: Country[],
  playerActions: string[],
  recentEvents: GameEvent[]
): Promise<{ events: string[], statUpdates: Record<string, Partial<Country['stats']>>, tokenUsage: number }> => {
  
  let ai;
  try {
    ai = getAI();
  } catch (e) {
    // Mode Offline / Fallback
    return { 
        events: generateFallbackLogic(playerActions, countries), 
        statUpdates: {}, 
        tokenUsage: 0 
    };
  }

  const relevantCountries = getRelevantCountries(countries, playerActions);
  const passiveUpdates: Record<string, Partial<Country['stats']>> = {};
  
  countries.forEach(c => {
    if (!relevantCountries.find(r => r.name === c.name)) {
      passiveUpdates[c.name] = calculatePassiveGrowth(c);
    }
  });

  const worldState = serializeWorldState(relevantCountries);
  const history = recentEvents.slice(-3).map(e => `T${e.turn}:${e.description.substring(0, 20)}`).join('|');
  const actions = playerActions.join(". ");

  // SYSTEM INSTRUCTION: COMPRESSED LOGIC MODE
  // On demande à l'IA d'agir comme un moteur logique, pas un écrivain.
  // Elle doit sortir des CODES que notre moteur interne transformera en beau texte.
  const systemInstruction = `
ROLE: Geopolitical Simulator Core.
INPUT: State, History, Actions.
TASK: Determine outcomes of actions and random global events.
OUTPUT FORMAT:
#E
EVENT:CODE|SOURCE_CODE|TARGET_CODE|EXTRA_INFO
(Codes: WAR_WIN, WAR_LOSS, ALLIANCE_NEW, ALLIANCE_JOIN, ALLIANCE_LEAVE, NUKE, ECO_BLOCK, SABOTAGE, GENERIC)
#U
CODE:Eco:Mil:Pop
`;

  const prompt = `
CTX:Turn ${currentTurn}
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
        maxOutputTokens: 600, // Réduit car on génère du code compressé
        temperature: 0.7, // Moins de créativité, plus de logique
      }
    });

    const text = response.text || "";
    const tokenUsage = response.usageMetadata?.totalTokenCount || 0;

    const events: string[] = [];
    const aiUpdates: Record<string, Partial<Country['stats']>> = {};

    const parts = text.split('#');
    
    parts.forEach(part => {
        const type = part.charAt(0);
        const lines = part.substring(1).trim().split('\n');

        if (type === 'E') {
            lines.forEach(line => {
                if (line.startsWith('EVENT:')) {
                    // Parsing: EVENT:WAR_WIN|USA|CHN|Details
                    const raw = line.replace('EVENT:', '').trim();
                    const [code, srcCode, tgtCode, extra] = raw.split('|');
                    
                    const srcName = getNameFromCodeOrName(srcCode || "UNK", countries);
                    const tgtName = getNameFromCodeOrName(tgtCode || "UNK", countries);
                    
                    // APPEL AU MOTEUR INTERNE
                    const richText = decodeEvent(code, srcName, tgtName, extra);
                    events.push(richText);
                }
            });
        }
        else if (type === 'U') {
            lines.forEach(line => {
                const segs = line.trim().split(':');
                if (segs.length >= 4) {
                    const p = parseInt(segs.pop() || "0");
                    const m = parseInt(segs.pop() || "0");
                    const e = parseInt(segs.pop() || "0");
                    const code = segs[0].trim();
                    const fullName = getNameFromCodeOrName(code, countries);

                    if (fullName && !isNaN(e)) {
                        aiUpdates[fullName] = { economy: e, military: m, population: p };
                    }
                }
            });
        }
    });

    if (events.length === 0) {
        // Fallback si l'IA n'a rien sorti d'intelligible
        events.push(...generateFallbackLogic(playerActions, countries));
    }

    return {
        events,
        statUpdates: { ...passiveUpdates, ...aiUpdates },
        tokenUsage
    };

  } catch (error) {
    console.error("Sim Error:", error);
    return {
      events: generateFallbackLogic(playerActions, countries),
      statUpdates: passiveUpdates,
      tokenUsage: 0
    };
  }
};