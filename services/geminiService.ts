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

// COMPRESSION DES DONNÉES
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
    
    return `${c.name}|${e}|${m}|${p}|${flags.join('_')}`;
  }).join('\n');
};

const serializeEvents = (events: GameEvent[]) => {
  // On ne garde que les 3 derniers pour le contexte immédiat
  return events.slice(-3).map(e => `T${e.turn}:${e.description.substring(0, 50)}...`).join('|');
};

export const simulateTurn = async (
  currentTurn: number,
  countries: Country[],
  playerActions: string[],
  recentEvents: GameEvent[],
  globalSummary: string = "" // Nouveau paramètre pour l'historique long terme
): Promise<{ events: string[], statUpdates: Record<string, Partial<Country['stats']>>, tokenUsage: number, newSummary?: string }> => {
  let ai;
  try {
    ai = getAI();
  } catch (e) {
    return { events: ["ERREUR SYSTÈME : Clé API manquante."], statUpdates: {}, tokenUsage: 0 };
  }

  // Logique de mise à jour du résumé tous les 10 tours
  const shouldUpdateSummary = currentTurn % 10 === 0;

  // Préparation des données compressées
  const worldStateCompact = serializeWorldState(countries);
  const recentHistoryCompact = serializeEvents(recentEvents);
  const actionsCompact = playerActions.length > 0 ? playerActions.join(". ") : "RAS";

  // Prompt Optimisé
  const prompt = `
    ROLE: Simu Géopolitique "World Down".
    DATA FORMAT: Country|Eco|Mil|Pop|Flags(N=Nuke,S=Space,DEAD=Destroyed).
    
    ETAT MONDE (T${currentTurn}):
    ${worldStateCompact}
    
    CONTEXTE HISTORIQUE (Résumé T1-T${Math.max(1, currentTurn - 10)}):
    ${globalSummary || "Début de l'ère."}

    ÉVÈNEMENTS RÉCENTS (Détail T${Math.max(1, currentTurn - 3)}-T${currentTurn}):
    ${recentHistoryCompact}

    ORDRES JOUEUR: ${actionsCompact}

    REGLES:
    1. JOUEUR: "Attaque"=Guerre. "Soutien"=Boost. "Blocus"=-Eco. "Alliance"=Amitié.
    2. IA: Forts (Mil>80) attaquent Faibles.
    3. NUCLÉAIRE: Flag 'N' = Dissuasion (pas d'invasion directe).
    4. DYNAMIQUE: Guerre = -Pop/-Eco/+Mil.
    ${shouldUpdateSummary ? "5. TACHE SUPP: Générer un nouveau résumé global compressé (newSummary) incluant les événements récents marquants." : ""}
    
    OBJECTIF: JSON strict.
  `;

  // Construction dynamique du schéma
  const schemaProperties: any = {
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
          economy: { type: Type.NUMBER },
          military: { type: Type.NUMBER },
          population: { type: Type.NUMBER },
        },
        required: ["countryName"]
      }
    }
  };

  // Ajout du champ résumé si nécessaire
  if (shouldUpdateSummary) {
    schemaProperties.newSummary = {
      type: Type.STRING,
      description: "Résumé condensé de tout l'historique important (Guerres, Alliances, Annexion) depuis le tour 1 jusqu'à maintenant."
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
        tokenUsage,
        newSummary: rawData.newSummary // Sera undefined si pas demandé
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