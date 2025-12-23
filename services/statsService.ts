import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Analyse les actions textuelles brutes et met à jour les compteurs globaux dans Firestore.
 * Structure dans Firestore: collection 'analytics', document 'global_trends'
 */
export const trackGameStats = async (actions: string[]) => {
  if (!db) return;

  const statsRef = doc(db, 'analytics', 'global_trends');
  const updates: Record<string, any> = {
    total_actions: increment(actions.length)
  };

  actions.forEach(action => {
    const lower = action.toLowerCase();

    // Catégorisation simple basée sur les mots-clés des logs
    if (lower.includes('attaque') || lower.includes('conquête') || lower.includes('annexé')) {
        updates['type_military'] = increment(1);
    }
    else if (lower.includes('alliance') || lower.includes('rejoint') || lower.includes('quitte') || lower.includes('diplomatie')) {
        updates['type_diplomacy'] = increment(1);
    }
    else if (lower.includes('nucléaire') || lower.includes('radiation')) {
        updates['type_nuclear'] = increment(1);
    }
    else if (lower.includes('économique') || lower.includes('blocus')) {
        updates['type_economy'] = increment(1);
    }
    else if (lower.includes('sabotage') || lower.includes('espionnage')) {
        updates['type_espionage'] = increment(1);
    }
  });

  try {
    // On essaie de mettre à jour
    await updateDoc(statsRef, updates);
  } catch (e: any) {
    // Si le document n'existe pas (première exécution jamais faite), on le crée
    if (e.code === 'not-found') {
        // On convertit les increments en nombres simples pour l'initialisation
        const initialData: any = {};
        for (const [key, val] of Object.entries(updates)) {
            // @ts-ignore - On sait que c'est un FieldValue increment, mais pour l'init on met 1 ou value
            initialData[key] = 1; 
        }
        await setDoc(statsRef, initialData);
    } else {
        console.warn("Erreur télémétrie:", e);
    }
  }
};

/**
 * Récupère les stats globales pour (optionnellement) les afficher ou adapter le jeu
 */
export const getGlobalStats = async () => {
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, 'analytics', 'global_trends'));
        if (snap.exists()) return snap.data();
        return null;
    } catch (e) {
        return null;
    }
};