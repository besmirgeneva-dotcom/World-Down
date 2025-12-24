import { db } from './firebase';
import firebase from 'firebase/compat/app';
import { GameState } from '../types';

export interface GameSaveData {
  id: string; // Firestore ID
  userId: string;
  name: string;
  date: string; // Formatted date string for display
  timestamp: any; // Firestore timestamp for sorting
  status: string;
  gameState: GameState;
}

export const saveGameToFirestore = async (userId: string, gameState: GameState, saveName: string) => {
  if (!db) throw new Error("Database not initialized");

  const saveDisplayDate = new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute:'2-digit' });
  const status = gameState.gameOver ? 'Terminé' : (gameState.events.length > 5 ? 'En Guerre' : 'En cours');

  const saveData = {
    userId,
    name: saveName,
    date: saveDisplayDate,
    timestamp: firebase.firestore.Timestamp.now(),
    status,
    gameState: gameState // On stocke tout l'état du jeu
  };

  // Chemin : users/{userId}/saves
  const docRef = await db.collection('users').doc(userId).collection('saves').add(saveData);
  
  return { ...saveData, id: docRef.id };
};

export const getUserSaves = async (userId: string): Promise<GameSaveData[]> => {
  if (!db) return [];

  const snapshot = await db.collection('users').doc(userId).collection('saves')
    .orderBy('timestamp', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as GameSaveData));
};

export const deleteSaveFromFirestore = async (userId: string, saveId: string) => {
  if (!db) return;
  await db.collection('users').doc(userId).collection('saves').doc(saveId).delete();
};