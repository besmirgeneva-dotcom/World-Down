import { GoogleGenAI, Type } from "@google/genai";
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

// --- SMART CONTEXT FILTERING ---
// Filtre les pays pour n'envoyer que ceux qui sont pertinents pour la simulation
// Évite d'envoyer les pays "passifs" sur lesquels le joueur a juste cliqué.
const getRelevantCountries = (countries: Country[], playerActions: string[]): Country[] => {
  const MAJOR_POWERS = ["United States", "China", "Russia", "Germany", "France", "United Kingdom", "India", "Japan", "Brazil", "Israel", "Iran", "North Korea"];
  
  // Concaténer toutes les actions pour recherche textuelle simple
  const actionsText = playerActions.join(" ").toLowerCase();

  return countries.filter(c => {
    // 1. Toujours inclure les puissances majeures et nucléaires
    if (MAJOR_POWERS.some(p => c.name.includes(p))) return true;
    if (c.stats.hasNuclear) return true;

    // 2. Inclure les pays mentionnés explicitement dans les actions du joueur (Cible ou Source)
    if (actionsText.includes(c.name.toLowerCase())) return true;

    // 3. Inclure les pays avec une forte armée (menaces potentielles)
    if (c.stats.military > 70) return true;

    // 4. Inclure les pays appartenant à une alliance (acteurs géopolitiques)
    if (c.allianceId) return true;

    return false;
  });
};

const serializeWorldState = (countries: Country[]) => {
  return countries.map(c => {
    // Format compact: ID|Eco|Mil|Pop|Flags
    const flags = [];
    if (c.stats.hasNuclear) flags.push('N');
    if (c.stats.hasSpaceProgram) flags.push('S');
    if (c.isDestroyed) flags.push('DEAD');
    
    const e = Math.round(c.stats.economy);
    const m = Math.round(c.stats.military);
    const p = Math.round(c.stats.population);
    
    // On garde le nom complet pour l'IA, c'est plus sûr pour la correspondance
    return `${c.name}|${e}|${m}|${p}|${flags.join('_')}`;
  }).join('\n');
};

const serializeEvents = (events: GameEvent[]) => {
  return events.slice(-3).map(e => `T${e.turn}:${e.description.substring(0, 50)}...`).join('|');
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
    return { events: ["ERREUR SYSTÈME : Clé API manquante."], statUpdates: {}, tokenUsage: 0 };
  }

  const shouldUpdateSummary = currentTurn % 10 === 0;

  // 1. FILTRAGE INTELLIGENT (Réduction Input)
  const relevantCountries = getRelevantCountries(countries, playerActions);
  
  const worldStateCompact = serializeWorldState(relevantCountries);
  const recentHistoryCompact = serializeEvents(recentEvents);
  const actionsCompact = playerActions.length > 0 ? playerActions.join(". ") : "RAS";

  // Prompt
  // Note: On demande un format de sortie compressé pour 'updates'
  const prompt = `
    ROLE: Simu Géopolitique "World Down".
    DATA: Country|Eco|Mil|Pop|Flags.
    
    ETAT (T${currentTurn}):
    ${worldStateCompact}
    
    HISTOIRE: ${globalSummary || "Début."}
    RECENT: ${recentHistoryCompact}
    ORDRES: ${actionsCompact}

    REGLES:
    1. JOUEUR: "Attaque"=Guerre. "Soutien"=Boost. "Alliance"=Amitié.
    2. IA: Forts (Mil>80) attaquent Faibles si pas d'alliance.
    3. NUCLÉAIRE: Flag 'N' = Dissuasion.
    
    OUTPUT FORMAT:
    - events: Liste de phrases.
    - updates: Liste de Strings "CountryName:EcoDelta:MilDelta:PopDelta" (Ex: "France:-5:2:0").
    ${shouldUpdateSummary ? "- newSummary: Texte résumé global." : ""}
  `;

  // 2. SCHEMA COMPRESSÉ (Réduction Output)
  // Au lieu d'objets complexes, on demande un tableau de strings simples
  const schemaProperties: any = {
    events: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Max 3 phrases narratives."
    },
    updates: {
      type: Type.ARRAY,
      items: { type: Type.STRING }, 
      description: "Format: 'CountryName:Eco:Mil:Pop' (ex: 'USA:5:-2:1')"
    }
  };

  if (shouldUpdateSummary) {
    schemaProperties.newSummary = {
      type: Type.STRING,
      description: "Résumé historique compressé."
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties
        }
      }
    });

    const text = response.text;
    const tokenUsage = response.usageMetadata?.totalTokenCount || 0;

    if (!text) return { events: ["Erreur de simulation IA."], statUpdates: {}, tokenUsage: 0 };

    const rawData = JSON.parse(text);

    // 3. PARSING DECOMPRESSION
    // On transforme les strings compactes de l'IA en objets utilisables par le Frontend
    const statUpdates: Record<string, Partial<Country['stats']>> = {};
    
    if (rawData.updates && Array.isArray(rawData.updates)) {
        rawData.updates.forEach((updateStr: string) => {
            // Format attendu: "Name:Eco:Mil:Pop"
            // On utilise le dernier ':' comme séparateur pour éviter les bugs si le nom contient ':' (rare mais possible)
            // Mais plus simple: split par ':' et on prend les 3 derniers comme chiffres.
            
            const parts = updateStr.split(':');
            if (parts.length >= 4) {
                const pop = parseInt(parts.pop() || "0");
                const mil = parseInt(parts.pop() || "0");
                const eco = parseInt(parts.pop() || "0");
                const name = parts.join(':').trim(); // Le reste est le nom

                if (name) {
                    statUpdates[name] = {
                        economy: isNaN(eco) ? 0 : eco,
                        military: isNaN(mil) ? 0 : mil,
                        population: isNaN(pop) ? 0 : pop
                    };
                }
            }
        });
    }

    return {
        events: rawData.events || [],
        statUpdates,
        tokenUsage,
        newSummary: rawData.newSummary
    };
  } catch (error) {
    console.error("Gemini simulation error:", error);
    return {
      events: ["La communication avec le simulateur global a échoué."],
      statUpdates: {},
      tokenUsage: 0
    };
  }
};