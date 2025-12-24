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

const getRandomCountry = (countries: Country[], excludeName?: string): string => {
    const pool = countries.filter(c => c.name !== excludeName && !c.isDestroyed);
    if (pool.length === 0) return "une nation étrangère";
    return pool[Math.floor(Math.random() * pool.length)].name;
};

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
    
    // 1. Process Player Actions
    actions.forEach(action => {
        const lower = action.toLowerCase();
        const source = countries.find(c => lower.includes(c.name.toLowerCase()))?.name || "Une Nation";
        
        if (lower.includes("alliance")) {
            events.push(decodeEvent("ALLIANCE_NEW", source, "Coalition"));
        } else if (lower.includes("rejoint")) {
            events.push(decodeEvent("ALLIANCE_JOIN", source, "l'Alliance"));
        } else if (lower.includes("quitte")) {
            events.push(decodeEvent("ALLIANCE_LEAVE", source, "ses alliés"));
        } else if (lower.includes("amis") || lower.includes("amitié")) {
            events.push(decodeEvent("FRIENDSHIP", source, getRandomCountry(countries, source)));
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
        } else if (lower.includes("politique") || lower.includes("ajusté") || lower.includes("stratégie")) {
            // New POLITICS handling for stat changes
            events.push(decodeEvent("POLITICS", source));
        } else {
            events.push(decodeEvent("GENERIC", source, "le monde"));
        }
    });

    // 2. Generate Ambient Events (to make sure we always have 2-3 events minimum)
    const extraNeeded = Math.max(0, 3 - events.length);
    for (let i = 0; i < extraNeeded; i++) {
        const rSrc = getRandomCountry(countries);
        const rTgt = getRandomCountry(countries, rSrc);
        events.push(decodeEvent("GENERIC", rSrc, rTgt));
    }

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

  // CALCUL DE LA CIBLE D'ÉVÈNEMENTS
  // On veut toujours au moins 2 évènements aléatoires en plus des actions du joueur.
  // Et on veut un total minimum de 3-4 évènements pour que le tour semble vivant.
  const playerActionCount = playerActions.length;
  // Si le joueur a fait 1 action, on veut ~3-4 évènements total -> on demande 3 randoms.
  // Si le joueur a fait 5 actions, on veut quand même 2 randoms pour le chaos mondial.
  const randomEventsNeeded = Math.max(2, 5 - playerActionCount);

  // SYSTEM INSTRUCTION: COMPRESSED LOGIC MODE
  const systemInstruction = `
ROLE: Geopolitical Simulator Core.
INPUT: State, History, Actions.
TASK: 
1. Determine outcomes of the ${playerActionCount} provided player actions.
2. Generate exactly ${randomEventsNeeded} additional RANDOM major geopolitical events (involving nations NOT in ACT if possible) to reach a dynamic world state.
IMPORTANT: Source and Target MUST be different countries for GENERIC, WAR, or DIPLOMACY events.
OUTPUT FORMAT:
#E
EVENT:CODE|SOURCE_CODE|TARGET_CODE|EXTRA_INFO
(Codes: WAR_WIN, WAR_LOSS, ALLIANCE_NEW, ALLIANCE_JOIN, ALLIANCE_LEAVE, FRIENDSHIP, NUKE, ECO_BLOCK, SABOTAGE, GENERIC, POLITICS)
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
        maxOutputTokens: 800, // Augmenté pour permettre plus d'évènements
        temperature: 0.8, // Un peu plus créatif pour la variété
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
                    let tgtName = getNameFromCodeOrName(tgtCode || "UNK", countries);

                    // --- SECURITY CHECK: Prevent Self-Referential Conflicts ---
                    if (srcName === tgtName) {
                        if (code === 'POLITICS') {
                            // C'est normal pour POLITICS (réforme interne), on ne change rien
                        } else if (code === 'WAR_WIN' || code === 'WAR_LOSS' || code === 'SABOTAGE') {
                            tgtName = "une faction rebelle"; // Guerre civile
                        } else {
                            // Pour diplomatie ou générique, on force un autre pays aléatoire
                            tgtName = getRandomCountry(countries, srcName);
                        }
                    }
                    // ----------------------------------------------------------
                    
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