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
    console.error("API_KEY is missing. Please set VITE_API_KEY or API_KEY in your environment.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- OPTIMIZATION: SHORT CODES ---
// Dictionnaire pour compresser les noms longs en 1 token
const COUNTRY_ALIASES: Record<string, string> = {
  "United States of America": "USA",
  "United Kingdom": "UK",
  "Russia": "RUS",
  "China": "CHN",
  "Germany": "DEU",
  "France": "FRA",
  "India": "IND",
  "Japan": "JPN",
  "Brazil": "BRA",
  "Israel": "ISR",
  "Iran": "IRN",
  "North Korea": "PRK",
  "South Korea": "KOR",
  "Taiwan": "TWN",
  "Canada": "CAN",
  "Australia": "AUS"
};

// Fonction inverse pour retrouver le nom complet
const getFullName = (code: string): string | undefined => {
  const entry = Object.entries(COUNTRY_ALIASES).find(([name, alias]) => alias === code);
  return entry ? entry[0] : undefined;
};

// Obtient le code court ou utilise les 3 premières lettres
const getShortCode = (name: string): string => {
  if (COUNTRY_ALIASES[name]) return COUNTRY_ALIASES[name];
  return name.substring(0, 3).toUpperCase();
};

// --- SMART CONTEXT FILTERING ---
const getRelevantCountries = (countries: Country[], playerActions: string[]): Country[] => {
  const MAJOR_POWERS = ["USA", "CHN", "RUS", "DEU", "FRA", "UK", "IND"];
  const actionsText = playerActions.join(" ").toLowerCase();

  return countries.filter(c => {
    const code = getShortCode(c.name);
    // 1. Majeurs (par code ou nom partiel)
    if (MAJOR_POWERS.includes(code)) return true;
    // 2. Interaction active
    if (actionsText.includes(c.name.toLowerCase())) return true;
    // 3. Nucléaire
    if (c.stats.hasNuclear) return true;
    // 4. Guerre/Détruit
    if (c.isDestroyed || (c.ownerId && c.ownerId !== c.name)) return true;
    return false;
  });
};

const serializeWorldState = (countries: Country[]) => {
  return countries.map(c => {
    // Format: COD|E|M|P|F
    // Ex: FRA|80|50|20|N
    let flags = "";
    if (c.stats.hasNuclear) flags += 'N';
    if (c.isDestroyed) flags += 'D';
    if (c.ownerId && c.ownerId !== c.name) flags += `>${getShortCode(c.ownerId)}`; // >USA indique annexé par USA
    
    // Arrondi pour supprimer les décimales inutiles
    const e = Math.floor(c.stats.economy);
    const m = Math.floor(c.stats.military);
    const p = Math.floor(c.stats.population);
    
    return `${getShortCode(c.name)}|${e}|${m}|${p}|${flags}`;
  }).join(' '); // Espace au lieu de newline économise un peu
};

const serializeEvents = (events: GameEvent[]) => {
  // Uniquement le dernier event, tronqué
  return events.slice(-1).map(e => `T${e.turn}:${e.description.substring(0, 25)}`).join('|');
};

export const simulateTurn = async (
  currentTurn: number,
  countries: Country[],
  playerActions: string[],
  recentEvents: GameEvent[],
  globalSummary: string = "" 
): Promise<{ events: string[], statUpdates: Record<string, Partial<Country['stats']>>, tokenUsage: number, newSummary?: string }> => {
  let ai;
  try {
    ai = getAI();
  } catch (e) {
    return { events: ["ERREUR API"], statUpdates: {}, tokenUsage: 0 };
  }

  const shouldUpdateSummary = currentTurn % 10 === 0;
  
  const relevantCountries = getRelevantCountries(countries, playerActions);
  const worldState = serializeWorldState(relevantCountries);
  const history = serializeEvents(recentEvents);
  
  // Si aucune action, on envoie "Wait" pour dire à l'IA de faire un tour calme
  const actions = playerActions.length > 0 ? playerActions.join(".") : "Wait";

  // PROMPT TELEGRAPHIQUE
  // Suppression de tous les mots de liaison. Syntaxe Data-only.
  const prompt = `
CTX:GeoPol Sim. LANG:FR. T:${currentTurn}.
STATE(Cod|E|M|P|Flg): ${worldState}
HIST:${globalSummary}|${history}
ACT:${actions}

RULES:
1.React to ACT. If Wait, minimal change.
2.High Mil(>80) threatens.
3.Flg: N=Nuke, D=Dead, >COD=OwnedBy.

OUT(RAW TXT):
#E
- Event FR (max 1)
#U
COD:Eco:Mil:Pop (Ex:FRA:80:55:20)
${shouldUpdateSummary ? "#S\nGlobalSum(FR)" : ""}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash est moins cher et suffit largement
      contents: prompt,
    });

    const text = response.text || "";
    const tokenUsage = response.usageMetadata?.totalTokenCount || 0;

    // --- PARSING MANUEL OPTIMISÉ ---
    const events: string[] = [];
    const statUpdates: Record<string, Partial<Country['stats']>> = {};
    let newSummary = undefined;

    // Découpage par marqueurs courts #E, #U, #S
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
                // Parsing: COD:E:M:P
                const segs = line.trim().split(':');
                if (segs.length >= 4) {
                    const p = parseInt(segs.pop() || "0");
                    const m = parseInt(segs.pop() || "0");
                    const e = parseInt(segs.pop() || "0");
                    const code = segs[0].trim();
                    
                    // Traduction Code -> Nom Complet
                    const fullName = getFullName(code) || (countries.find(c => c.name.startsWith(code))?.name);

                    if (fullName && !isNaN(e)) {
                        statUpdates[fullName] = { economy: e, military: m, population: p };
                    }
                }
            });
        }
        else if (type === 'S' && shouldUpdateSummary) {
            newSummary = content;
        }
    });

    // Fallback events si vide
    if (events.length === 0) events.push("Calme précaire.");

    return {
        events,
        statUpdates,
        tokenUsage,
        newSummary
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