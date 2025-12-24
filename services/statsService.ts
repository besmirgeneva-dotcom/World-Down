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
    // Si le document n'existe pas (première exécution jamais faite), on le crée
    // On convertit les increments en nombres simples pour l'initialisation si nécessaire, 
    // ou on utilise set avec merge (mais merge avec increment fonctionne bien en v9, en v8 set + merge peut être mieux)
    
    // Pour v8 simple, si update fail, on fait set.
    // Mais set avec increment fonctionne aussi pour initialiser.
    
    // Alternative: lire avant. Mais ici on va tenter le set direct si update fail.
    // On refait updates sans increment pour l'init car on part de 0? 
    // Non, increment(1) sur un champ vide le met à 1.
    await statsRef.set(updates, { merge: true });
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
        return null;
    }
};