import { db } from './firebase';
import firebase from 'firebase/compat/app';

/**
 * Analyse les actions textuelles brutes et met à jour les compteurs globaux dans Firestore.
 * Structure dans Firestore: collection 'analytics', document 'global_trends'
 */
export const trackGameStats = async (actions: string[]) => {
  if (!db) return;

  const statsRef = db.collection('analytics').doc('global_trends');
  const increment = firebase.firestore.FieldValue.increment;
  
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
    await statsRef.update(updates);
  } catch (e: any) {
    // Si permission refusée, on ignore silencieusement pour ne pas polluer la console (analytics non critique)
    if (e.code === 'permission-denied') return;

    // Si le document n'existe pas, on tente de le créer
    try {
        await statsRef.set(updates, { merge: true });
    } catch (innerE: any) {
        // On ignore aussi les permissions ici
        if (innerE.code !== 'permission-denied') {
            console.warn("Stats tracking error:", innerE);
        }
    }
  }
};

/**
 * Récupère les stats globales pour (optionnellement) les afficher ou adapter le jeu
 */
export const getGlobalStats = async () => {
    if (!db) return null;
    try {
        const snap = await db.collection('analytics').doc('global_trends').get();
        if (snap.exists) return snap.data();
        return null;
    } catch (e) {
        // Ignore errors
        return null;
    }
};