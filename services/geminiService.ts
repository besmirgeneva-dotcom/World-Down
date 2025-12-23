import { GoogleGenAI, Type } from "@google/genai";
import { Country, GameEvent } from "../types";

// Helper robuste pour récupérer la clé API (supporte process.env et Vite import.meta.env)
const getApiKey = () => {
  // @ts-ignore - Support Vite
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // @ts-ignore - Support Node/Webpack
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

// COMPRESSION DES DONNÉES (Point 1: Réduire la verbosité)
const serializeWorldState = (countries: Country[]) => {
  return countries.map(c => {
    // Format compact: ID|Eco|Mil|Pop|Flags
    // Ex: US|90|95|40|N_S
    const flags = [];
    if (c.stats.hasNuclear) flags.push('N');
    if (c.stats.hasSpaceProgram) flags.push('S');
    if (c.isDestroyed) flags.push('DEAD');
    
    // On arrondit pour économiser des caractères
    const e = Math.round(c.stats.economy);
    const m = Math.round(c.stats.military);
    const p = Math.round(c.stats.population);
    
    return `${c.name}|${e}|${m}|${p}|${flags.join('_')}`;
  }).join('\n');
};

const serializeEvents = (events: GameEvent[]) => {
  // On ne garde que les 3 derniers, format très court
  // T5: Guerre en Europe
  return events.slice(-3).map(e => `T${e.turn}:${e.description.substring(0, 50)}...`).join('|');
};

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
    return { events: ["ERREUR SYSTÈME : Clé API manquante."], statUpdates: {}, tokenUsage: 0 };
  }

  // Préparation des données compressées
  const worldStateCompact = serializeWorldState(countries);
  const historyCompact = serializeEvents(recentEvents);
  const actionsCompact = playerActions.length > 0 ? playerActions.join(". ") : "RAS";

  // Prompt Télégraphique (Point 3: Optimisation System Prompt)
  const prompt = `
    ROLE: Simu Géopolitique "World Down".
    DATA FORMAT: Country|Eco|Mil|Pop|Flags(N=Nuke,S=Space,DEAD=Destroyed).
    
    ETAT MONDE (T${currentTurn}):
    ${worldStateCompact}
    
    HISTOIRE: ${historyCompact}
    ORDRES JOUEUR: ${actionsCompact}

    REGLES:
    1. JOUEUR: "Attaque"=Guerre(Invasion). "Soutien"=Boost Cible. "Blocus"=-Eco Cible. "Alliance"=Boost Relations.
    2. IA: Pays forts (Mil>80) agressent voisins faibles. 
    3. NUCLÉAIRE: Si flag 'N', pas d'invasion directe (dissuasion), guerre éco seulement.
    4. DYNAMIQUE: Guerre = -Pop/-Eco/+Mil. Paix = +Eco.
    
    OBJECTIF:
    Générer JSON strict. 3 événements narratifs max. Updates stats réalistes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // On garde le schema pour garantir que le frontend ne casse pas
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Max 3 phrases narratives."
            },
            updates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  countryName: { type: Type.STRING },
                  economy: { type: Type.NUMBER, description: "+/-" },
                  military: { type: Type.NUMBER, description: "+/-" },
                  population: { type: Type.NUMBER, description: "+/-" },
                },
                required: ["countryName"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    const tokenUsage = response.usageMetadata?.totalTokenCount || 0;

    if (!text) return { events: ["Erreur de simulation IA."], statUpdates: {}, tokenUsage: 0 };

    const rawData = JSON.parse(text);

    const statUpdates: Record<string, Partial<Country['stats']>> = {};
    if (rawData.updates && Array.isArray(rawData.updates)) {
        rawData.updates.forEach((u: any) => {
            if (u.countryName) {
                statUpdates[u.countryName] = {
                    economy: u.economy || 0,
                    military: u.military || 0,
                    population: u.population || 0
                };
            }
        });
    }

    return {
        events: rawData.events || [],
        statUpdates,
        tokenUsage
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