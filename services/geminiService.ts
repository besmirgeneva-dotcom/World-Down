import { GoogleGenAI, Type } from "@google/genai";
import { Country, GameEvent } from "../types";

// Helper to initialize AI. 
const getAI = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const simulateTurn = async (
  currentTurn: number,
  countries: Country[],
  playerActions: string[],
  recentEvents: GameEvent[] // Added history for context
): Promise<{ events: string[], statUpdates: Record<string, Partial<Country['stats']>> }> => {
  const ai = getAI();

  // Filter mainly active countries or just send name + stats to reduce context size
  const worldState = countries.map(c => ({
    name: c.name,
    stats: c.stats
  }));

  const lastFiveEvents = recentEvents.slice(-5).map(e => `Tour ${e.turn}: ${e.description}`);

  const prompt = `
    Vous êtes le moteur de simulation (Game Master) ultra-réaliste pour "World Down".
    
    Règles Absolues de Simulation :
    1. **ORDRES STRATÉGIQUES (PRIORITÉ ABSOLUE)** : Analysez les "playerActions".
       - Si l'action est **"Attaque Militaire"**, c'est une GUERRE OUVERTE. Le(s) attaquant(s) envahissent.
       - Si l'action est **"Soutien Militaire"**, le(s) pays source(s) envoient des ressources et armements. Hausse Militaire et Économie pour la cible, renforcement diplomatique.
       - Si l'action est **"Blocus Économique"**, l'économie de la cible doit chuter (-10 à -20), mais pas de guerre directe.
       - Si l'action est **"Sabotage"**, baisse modérée Militaire et Économie de la cible, événements mystérieux.
       - Si l'action est **"Alliance"**, les relations s'améliorent (narratif), peut-être un léger bonus éco.
       - Si l'action est **"Déclarer Ennemi"**, tensions diplomatiques, risque de guerre future.
    2. **Impérialisme Agressif** : Les nations ne sont pas passives. Les pays puissants (Militaire/Pop élevé) cherchent ACTIVEMENT à envahir leurs voisins pour les ressources. Générez fréquemment des débuts de conflits ou des invasions.
    3. **Guerres Longues** : Une invasion ou annexion prend AU MINIMUM 10 tours. Ne déclarez jamais "Le pays X a conquis le pays Y" en un seul tour. Décrivez des "offensives", "sièges", "bombardements" ou "enlisements".
    4. **Réalisme Géopolitique** : La dissuasion nucléaire fonctionne. Si un pays a 'hasNuclear', on évite l'invasion directe, on préfère la guerre par procuration ou économique.
    5. **Fluctuations** : L'économie, le militaire et la population DOIVENT fluctuer selon les événements (Guerre = baisse population/éco, hausse militaire temporaire puis chute).
    6. **Influence du Joueur (Stats)** : Si le joueur a renforcé un pays (ex: Taiwan), une tentative d'invasion ennemie (ex: Chine) doit échouer ou être très coûteuse pour l'attaquant.
    
    État actuel du monde (Tour ${currentTurn}):
    ${JSON.stringify(worldState)}

    Historique Récent (Contexte):
    ${JSON.stringify(lastFiveEvents)}

    Actions du joueur (Maître du Monde) ce tour-ci:
    ${playerActions.length > 0 ? JSON.stringify(playerActions) : "Aucune intervention directe."}

    Tâche:
    1. Générez 3 à 5 événements majeurs (Si un ordre est donné, il doit être le premier événement et avoir des conséquences immédiates sur les stats).
    2. Calculez les impacts chiffrés sur les stats.
    
    Répondez UNIQUEMENT avec ce JSON :
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Descriptions narratives des événements."
            },
            updates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  countryName: { type: Type.STRING },
                  economy: { type: Type.NUMBER, description: "Delta (ex: -5, 10)" },
                  military: { type: Type.NUMBER, description: "Delta (ex: -5, 10)" },
                  population: { type: Type.NUMBER, description: "Delta (ex: -5, 10)" },
                },
                required: ["countryName"]
              },
              description: "Changements de stats."
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { events: ["Erreur de simulation IA."], statUpdates: {} };

    const rawData = JSON.parse(text);

    // Transform back to Record<string, stats>
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
        statUpdates
    };
  } catch (error) {
    console.error("Gemini simulation error:", error);
    return {
      events: ["La communication avec le simulateur global a échoué."],
      statUpdates: {}
    };
  }
};