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

// --- SMART CONTEXT FILTERING ---
const getRelevantCountries = (countries: Country[], playerActions: string[]): Country[] => {
  // Liste restreinte aux vrais acteurs majeurs pour économiser les tokens
  const MAJOR_POWERS = [
    "United States", "China", "Russia", "Germany", "France", 
    "United Kingdom", "India", "Japan", "Brazil", "Israel", "Iran", "North Korea"
  ];
  
  const actionsText = playerActions.join(" ").toLowerCase();

  return countries.filter(c => {
    // 1. Toujours inclure les majeurs (filtrage par nom partiel pour sécurité)
    if (MAJOR_POWERS.some(p => c.name.includes(p))) return true;
    
    // 2. Pays impliqués dans des actions récentes
    if (actionsText.includes(c.name.toLowerCase())) return true;
    
    // 3. Pays avec armes nucléaires (toujours pertinents)
    if (c.stats.hasNuclear) return true;

    // 4. Pays en guerre ou détruits (pour suivi)
    if (c.isDestroyed || c.ownerId !== c.name) return true;

    // 5. Chef d'alliance
    if (c.allianceId && !c.allianceId.includes(c.name)) return true; // Simplification

    return false;
  });
};

const serializeWorldState = (countries: Country[]) => {
  return countries.map(c => {
    // Format ultra-court: Nom|E|M|P|Flags
    // Ex: France|80|50|20|ND
    let flags = "";
    if (c.stats.hasNuclear) flags += 'N';
    if (c.isDestroyed) flags += 'D';
    if (c.ownerId && c.ownerId !== c.name) flags += `(Own:${c.ownerId})`; // Indique annexion
    
    // Arrondi strict
    const e = Math.floor(c.stats.economy);
    const m = Math.floor(c.stats.military);
    const p = Math.floor(c.stats.population);
    
    return `${c.name}|${e}|${m}|${p}|${flags}`;
  }).join('\n');
};

const serializeEvents = (events: GameEvent[]) => {
  // On ne garde que le tout dernier événement pour le contexte immédiat
  return events.slice(-1).map(e => `T${e.turn}:${e.description.substring(0, 30)}`).join('|');
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
  
  // Filtrage drastique
  const relevantCountries = getRelevantCountries(countries, playerActions);
  
  const worldState = serializeWorldState(relevantCountries);
  const history = serializeEvents(recentEvents);
  const actions = playerActions.length > 0 ? playerActions.join(". ") : "RAS";

  // PROMPT MINIFIÉ (Token saving + Force French)
  const prompt = `
CTX:Jeu Stratégie. LANGUE:FRANÇAIS(OBLIGATOIRE). T:${currentTurn}.
DATA(Nom|Eco|Mil|Pop|Flags):
${worldState}
HIST:${globalSummary}|${history}
ACT:${actions}

REGLES:
1.Si act joueur, réagir. Sinon, évolution monde subtile.
2.Forts(Mil>80) dominent.
3.N=Nuke(Dissuasion).

FORMAT REPONSE (TEXTE BRUT STRICT):
===E===
- (1 phrase événement majeur en français)
- (1 phrase conséquence en français, optionnel)
===U===
NomPays:Eco:Mil:Pop (Ex: France:80:55:20)
${shouldUpdateSummary ? "===S===\n(Résumé global court 2 phrases)" : ""}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text || "";
    const tokenUsage = response.usageMetadata?.totalTokenCount || 0;

    // --- PARSING MANUEL ---
    const events: string[] = [];
    const statUpdates: Record<string, Partial<Country['stats']>> = {};
    let newSummary = undefined;

    const sections = text.split('===');
    
    // Recherche des sections par contenu approximatif si l'IA foire un peu le formatage
    let eventContent = "";
    let updateContent = "";
    let summaryContent = "";

    // Logique de parsing plus souple
    for (let i = 0; i < sections.length; i++) {
        const s = sections[i].trim();
        if (s.startsWith('E')) eventContent = sections[i+1];
        if (s.startsWith('U')) updateContent = sections[i+1];
        if (s.startsWith('S')) summaryContent = sections[i+1];
    }

    // Fallback si format strict respecté
    if (!eventContent) eventContent = text.split('===E===')[1]?.split('===U===')[0] || "";
    if (!updateContent) updateContent = text.split('===U===')[1]?.split('===S===')[0] || "";

    // Parse Events
    if (eventContent) {
        eventContent.split('\n').forEach(line => {
            const clean = line.trim().replace(/^-\s*/, '').replace(/^\*\s*/, '');
            if (clean && clean.length > 3) events.push(clean);
        });
    }

    // Parse Updates
    if (updateContent) {
        updateContent.split('\n').forEach(line => {
            // Format attendu: Name:E:M:P
            const parts = line.trim().split(':');
            if (parts.length >= 4) {
                const p = parseInt(parts.pop() || "0");
                const m = parseInt(parts.pop() || "0");
                const e = parseInt(parts.pop() || "0");
                const name = parts.join(':').trim();
                
                // Vérification basique anti-hallucination
                if (name && !isNaN(e) && !isNaN(m)) {
                    statUpdates[name] = { economy: e, military: m, population: p };
                }
            }
        });
    }

    // Parse Summary
    if (shouldUpdateSummary && summaryContent) {
        newSummary = summaryContent.trim();
    }

    return {
        events: events.length ? events : ["Le monde retient son souffle."],
        statUpdates,
        tokenUsage,
        newSummary
    };

  } catch (error) {
    console.error("Gemini simulation error:", error);
    return {
      events: ["Erreur de communication comlink."],
      statUpdates: {},
      tokenUsage: 0
    };
  }
};