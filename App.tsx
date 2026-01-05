import React, { useState, useCallback, useEffect } from 'react';
import Map from './components/Map';
import CountryPanel from './components/CountryPanel';
import EventLog from './components/EventLog';
import EventCard from './components/EventCard';
import CommandBar, { ACTIONS } from './components/CommandBar';
import AllianceOverlay from './components/AllianceOverlay';
import Home from './components/Home';
import Hub from './components/Hub';
import LoginModal from './components/LoginModal';
import SettingsModal from './components/SettingsModal';
import { Country, GameState, StatType, GameEvent, Alliance } from './types';
import { simulateTurn } from './services/geminiService';
import { auth } from './services/firebase';
import { getUserSaves, saveGameToFirestore, deleteSaveFromFirestore, GameSaveData } from './services/saveService';
import { trackGameStats } from './services/statsService';
import { Globe, Play, Loader2, Swords, History, Users, Settings, Eye, Cpu, AlertCircle } from 'lucide-react';

const INITIAL_ALLIANCES: Alliance[] = [
  { id: 'NATO', name: 'OTAN', color: '#004990', leaderId: 'United States' },
  { id: 'BRICS', name: 'BRICS', color: '#DE4A39', leaderId: 'China' },
];

const INITIAL_COUNTRIES: Country[] = [
  { id: "United States", name: "United States of America", allianceId: 'NATO', stats: { economy: 90, military: 95, population: 40, hasNuclear: true, hasSpaceProgram: true } },
  { id: "China", name: "China", allianceId: 'BRICS', stats: { economy: 85, military: 85, population: 98, hasNuclear: true, hasSpaceProgram: true } },
  { id: "Russia", name: "Russia", allianceId: 'BRICS', stats: { economy: 50, military: 90, population: 30, hasNuclear: true, hasSpaceProgram: true } },
  { id: "Germany", name: "Germany", allianceId: 'NATO', stats: { economy: 80, military: 40, population: 20, hasNuclear: false, hasSpaceProgram: true } },
  { id: "France", name: "France", allianceId: 'NATO', stats: { economy: 75, military: 50, population: 20, hasNuclear: true, hasSpaceProgram: true } },
  { id: "India", name: "India", allianceId: 'BRICS', stats: { economy: 60, military: 60, population: 95, hasNuclear: true, hasSpaceProgram: true } },
  { id: "Brazil", name: "Brazil", allianceId: 'BRICS', stats: { economy: 45, military: 30, population: 45, hasNuclear: false, hasSpaceProgram: false } },
  { id: "Japan", name: "Japan", allianceId: null, stats: { economy: 85, military: 45, population: 25, hasNuclear: false, hasSpaceProgram: true } },
  { id: "United Kingdom", name: "United Kingdom", allianceId: 'NATO', stats: { economy: 70, military: 55, population: 20, hasNuclear: true, hasSpaceProgram: true } },
  { id: "Taiwan", name: "Taiwan", allianceId: null, stats: { economy: 80, military: 40, population: 10, hasNuclear: false, hasSpaceProgram: false } }, 
  { id: "North Korea", name: "North Korea", allianceId: null, stats: { economy: 10, military: 70, population: 15, hasNuclear: true, hasSpaceProgram: false } },
];

type ViewMode = 'HOME' | 'HUB' | 'GAME';

// Helper pour générer des stats réalistes basées sur le nom du pays
const generateRandomStats = (name: string) => {
    // Mots-clés pour identifier les économies avancées/riches (heuristique simple)
    const RICH_KEYWORDS = [
      "United States", "Kingdom", "Germany", "France", "Japan", "Canada", "Australia", 
      "Italy", "Spain", "Netherlands", "Switzerland", "Sweden", "Norway", "Denmark", 
      "Finland", "Belgium", "Austria", "New Zealand", "Ireland", "Singapore", "Israel",
      "Korea", "Emirates", "Qatar", "Luxembourg"
    ];
  
    const isRich = RICH_KEYWORDS.some(k => name.includes(k));
    
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
    if (isRich) {
      // Pays riches : stats entre 25 et 35 (sauf population qui varie plus)
      return {
        economy: rand(25, 35),
        military: rand(20, 35),
        population: rand(15, 35)
      };
    } else {
      // Autres pays : stats entre 10 et 25
      return {
        economy: rand(10, 25),
        military: rand(10, 25),
        population: rand(10, 30)
      };
    }
};

// Helper pour clamer les valeurs entre 0 et 100
const clamp = (val: number) => Math.max(0, Math.min(100, val));

export default function App() {
  const [view, setView] = useState<ViewMode>('HOME');
  const [user, setUser] = useState<{ uid: string; name: string; email: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [saves, setSaves] = useState<GameSaveData[]>([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    turn: 1,
    countries: INITIAL_COUNTRIES,
    alliances: INITIAL_ALLIANCES,
    events: [],
    selectedCountryId: null,
    isSimulating: false,
    gameOver: false,
    tokensUsed: 0,
    turnModifications: {}, // Initialize empty
  });

  const [playerActions, setPlayerActions] = useState<string[]>([]);
  const [mapViewMode, setMapViewMode] = useState<'political' | 'alliances'>('political');
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [commandSources, setCommandSources] = useState<Country[]>([]);
  const [commandTarget, setCommandTarget] = useState<Country | null>(null);
  const [commandAction, setCommandAction] = useState<string>(ACTIONS[0].id);
  const [activeCommandSlot, setActiveCommandSlot] = useState<'source' | 'target'>('source');
  const [pendingEvents, setPendingEvents] = useState<GameEvent[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Commandant',
          email: firebaseUser.email || ''
        });
        if (view === 'HOME') setView('HUB');
      } else {
        setUser(null);
        setView('HOME');
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [view]);

  useEffect(() => {
    if (user && view === 'HUB') {
      setIsLoadingSaves(true);
      getUserSaves(user.uid)
        .then(fetchedSaves => setSaves(fetchedSaves))
        .catch(console.error)
        .finally(() => setIsLoadingSaves(false));
    }
  }, [user, view]);

  useEffect(() => {
    if (['Alliance', 'Rejoindre Alliance', 'Quitter Alliance'].includes(commandAction)) {
      setMapViewMode('alliances');
    }
  }, [commandAction]);

  const handleLogin = (userData: { name: string; email: string }) => {
    setIsLoginModalOpen(false);
    setView('HUB');
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      setSaves([]); 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleCountrySelect = (id: string) => {
    let country = gameState.countries.find(c => c.name === id);
    if (!country) {
       // GÉNÉRATION ALÉATOIRE (10-35) AU LIEU DE 50
       const randomStats = generateRandomStats(id);
       country = { 
           id, 
           name: id, 
           stats: { 
               ...randomStats, 
               hasNuclear: false, 
               hasSpaceProgram: false 
           } 
       };
       setGameState(prev => ({ ...prev, countries: [...prev.countries, country!] }));
    }

    const effectiveOwnerId = country?.ownerId || id;
    const effectiveOwner = gameState.countries.find(c => c.name === effectiveOwnerId) || country;

    if (isCommandMode) {
      if (activeCommandSlot === 'source') {
        if (effectiveOwner?.isDestroyed) return;
        setCommandSources(prev => {
          const exists = prev.find(c => c.name === effectiveOwner!.name);
          if (exists) return prev.filter(c => c.name !== effectiveOwner!.name);
          return [...prev, effectiveOwner!];
        });
      } else {
        // Logique spécifique pour la cible selon l'action
        if (commandAction === 'Rejoindre Alliance') {
             // Si on veut rejoindre une alliance, on ne peut cliquer que sur les LEADERS
             const targetAlliance = gameState.alliances.find(a => a.leaderId === country?.id);
             if (targetAlliance) {
                 setCommandTarget(country || null);
             }
        } else {
            setCommandTarget(country || null);
        }
      }
    } else setGameState(prev => ({ ...prev, selectedCountryId: effectiveOwnerId }));
  };

  // --- STAT MANIPULATION HANDLERS ---
  const handleStatChange = (countryName: string, stat: StatType, delta: number) => {
    // Vérifier si cette stat a déjà été modifiée pour ce pays ce tour-ci
    const currentMods = gameState.turnModifications[countryName] || [];
    if (currentMods.includes(stat)) {
        return; // Modification bloquée
    }

    // AJOUT: Enregistrement de l'action pour permettre le passage du tour
    const statLabels: Record<string, string> = {
        [StatType.ECONOMY]: 'Économie',
        [StatType.MILITARY]: 'Militaire',
        [StatType.POPULATION]: 'Population'
    };
    const actionDesc = `POLITIQUE: ${countryName} a ajusté son niveau de ${statLabels[stat]} (${delta > 0 ? '+' : ''}${delta}).`;
    setPlayerActions(prev => [...prev, actionDesc]);

    setGameState(prev => {
        // Enregistrer la modification
        const updatedMods = { 
            ...prev.turnModifications, 
            [countryName]: [...(prev.turnModifications[countryName] || []), stat] 
        };

        return {
            ...prev,
            turnModifications: updatedMods,
            countries: prev.countries.map(c => {
                if (c.name !== countryName) return c;
                const currentVal = c.stats[stat];
                if (typeof currentVal === 'number') {
                    const newVal = Math.max(0, Math.min(100, currentVal + delta));
                    return { ...c, stats: { ...c.stats, [stat]: newVal } };
                }
                return c;
            })
        };
    });
  };

  const handleToggleCapability = (countryName: string, capability: 'hasNuclear' | 'hasSpaceProgram') => {
    const country = gameState.countries.find(c => c.name === countryName);
    if (!country) return;

    // RÈGLE 1 : Limitation d'une modification par tour (StatType.NUCLEAR ou StatType.SPACE)
    const currentMods = gameState.turnModifications[countryName] || [];
    const statType = capability === 'hasNuclear' ? StatType.NUCLEAR : StatType.SPACE;
    
    // Si ON A DÉJÀ touché au nucléaire OU au spatial ce tour-ci, on bloque
    if (currentMods.includes(StatType.NUCLEAR) || currentMods.includes(StatType.SPACE)) {
        return; 
    }

    // RÈGLE 2 : Dépendance technologique
    // Pour activer le Nucléaire, il faut avoir le Spatial
    if (capability === 'hasNuclear') {
        // Si on essaie d'activer (donc actuellement c'est false)
        if (!country.stats.hasNuclear && !country.stats.hasSpaceProgram) {
            // Pas de programme spatial = Pas de nucléaire
            return;
        }
    }

    // AJOUT: Enregistrement de l'action
    const capLabel = capability === 'hasNuclear' ? 'Arsenal Nucléaire' : 'Programme Spatial';
    // On devine l'action (activation ou désactivation) basé sur l'état actuel inversé
    const newStatus = !country.stats[capability] ? "lancé" : "abandonné";
    const actionDesc = `STRATÉGIE: ${countryName} a ${newStatus} son ${capLabel}.`;
    setPlayerActions(prev => [...prev, actionDesc]);

    setGameState(prev => {
        const updatedMods = { 
            ...prev.turnModifications, 
            [countryName]: [...(prev.turnModifications[countryName] || []), statType] 
        };

        return {
            ...prev,
            turnModifications: updatedMods,
            countries: prev.countries.map(c => {
                if (c.name !== countryName) return c;
                return { ...c, stats: { ...c.stats, [capability]: !c.stats[capability] } };
            })
        };
    });
  };
  // ----------------------------------

  const handleExecuteCommand = () => {
     if (commandSources.length === 0) return;
     const conqueror = commandSources[0]; // Leader ou source principale
     
     // --- 1. VALIDATION DES RÈGLES ---
     
     if (commandAction === 'Alliance') {
        // RÈGLE: Min 35 Economie pour créer
        if (conqueror.stats.economy < 35) {
            alert("Économie insuffisante (Min 35) pour fonder une alliance.");
            return;
        }
     }
     
     if (commandAction === 'Rejoindre Alliance') {
        // RÈGLE: On ne peut pas rejoindre une autre alliance si on est déjà dans une alliance.
        if (conqueror.allianceId) {
            alert(`Action impossible : ${conqueror.name} doit d'abord quitter son alliance actuelle.`);
            return;
        }
        // RÈGLE: Min 20 Economie pour rejoindre
        if (conqueror.stats.economy < 20) {
            alert("Économie insuffisante (Min 20) pour intégrer une alliance.");
            return;
        }
     }

     if (commandAction === 'Attaque Militaire') {
         // RÈGLE: Min 45 Militaire pour déclarer guerre
         if (conqueror.stats.military < 45) {
             alert("Puissance militaire insuffisante (Min 45) pour déclarer une guerre.");
             return;
         }
     }

     if (commandAction === 'Annexer' && commandTarget) {
         // RÈGLE: Avoir +5 dans chaque stat par rapport à la cible
         const diffEco = conqueror.stats.economy - commandTarget.stats.economy;
         const diffMil = conqueror.stats.military - commandTarget.stats.military;
         const diffPop = conqueror.stats.population - commandTarget.stats.population;

         if (diffEco <= 5 || diffMil <= 5 || diffPop <= 5) {
             alert("Domination insuffisante : Vous devez avoir au moins +5 de plus que la cible dans CHAQUE statistique (Éco, Mil, Pop) pour annexer.");
             return;
         }
     }

     if (commandAction === 'Soutien Militaire') {
         // RÈGLE: Min 10 Militaire
         if (conqueror.stats.military < 10) {
             alert("Forces militaires insuffisantes (Min 10) pour envoyer du soutien.");
             return;
         }
     }

     // --- 2. EXÉCUTION & COÛTS ---

     // Copie profonde pour modification locale optimiste
     let updatedCountries = [...gameState.countries];
     let updatedAlliances = [...gameState.alliances];
     let commandDesc = "";

     // --- Logique Locale pour mise à jour immédiate ---
     
     if (commandAction === 'Annexer' && commandTarget) {
        // COÛT: -15 Economie
        updatedCountries = updatedCountries.map(c => {
            if (c.name === conqueror.name) return { ...c, stats: { ...c.stats, economy: clamp(c.stats.economy - 15) } };
            if (c.name === commandTarget.name) return { ...c, ownerId: conqueror.name, isDestroyed: false };
            return c;
        });
        commandDesc = `CONQUÊTE: ${conqueror.name} a annexé ${commandTarget.name}.`;
     
     } else if (commandAction === 'Alliance') {
        // COÛT: -15 Economie
        const allianceName = `Coalition ${conqueror.name}`;
        const allianceId = `ALL_${Date.now()}`;
        const colors = ['#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#6366f1'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const newAlliance: Alliance = { id: allianceId, name: allianceName, color: color, leaderId: conqueror.name };
        updatedAlliances.push(newAlliance);

        updatedCountries = updatedCountries.map(c => {
             if (commandSources.some(s => s.name === c.name)) {
                 const newStats = c.name === conqueror.name 
                    ? { ...c.stats, economy: clamp(c.stats.economy - 15) } 
                    : c.stats;
                 return { ...c, allianceId: allianceId, stats: newStats };
             }
             return c;
        });
        commandDesc = `DIPLOMATIE: Création de l'alliance "${allianceName}" par ${conqueror.name}.`;

     } else if (commandAction === 'Rejoindre Alliance' && commandTarget) {
        const targetAllianceId = commandTarget.allianceId;
        if (targetAllianceId) {
            // Pas de coût explicite demandé pour rejoindre, juste prérequis
            updatedCountries = updatedCountries.map(c => 
                commandSources.some(s => s.name === c.name) ? { ...c, allianceId: targetAllianceId } : c
            );
            const allianceName = updatedAlliances.find(a => a.id === targetAllianceId)?.name;
            commandDesc = `DIPLOMATIE: ${conqueror.name} a officiellement rejoint l'alliance ${allianceName}.`;
        }

     } else if (commandAction === 'Quitter Alliance') {
        // COÛT: -15 Economie
        updatedCountries = updatedCountries.map(c => 
            commandSources.some(s => s.name === c.name) 
                ? { ...c, allianceId: null, stats: { ...c.stats, economy: clamp(c.stats.economy - 15) } } 
                : c
        );
        commandDesc = `DIPLOMATIE: ${conqueror.name} quitte son alliance (-15 Économie).`;

     } else if (commandAction === 'Attaque Militaire' && commandTarget) {
        // COÛT: -15 Mil, -15 Eco, -10 Pop pour les DEUX
        updatedCountries = updatedCountries.map(c => {
            if (c.name === conqueror.name || c.name === commandTarget.name) {
                return {
                    ...c,
                    stats: {
                        ...c.stats,
                        military: clamp(c.stats.military - 15),
                        economy: clamp(c.stats.economy - 15),
                        population: clamp(c.stats.population - 10)
                    }
                };
            }
            return c;
        });
        commandDesc = `GUERRE: ${conqueror.name} déclare la guerre à ${commandTarget.name}. Lourdes pertes bilatérales immédiates.`;

     } else if (commandAction === 'Soutien Militaire' && commandTarget) {
        // COÛT: -10 Militaire pour la source
        // BENEFICE: +10 Militaire pour la cible (Impliqué par "Soutien")
        updatedCountries = updatedCountries.map(c => {
            if (c.name === conqueror.name) return { ...c, stats: { ...c.stats, military: clamp(c.stats.military - 10) } };
            if (c.name === commandTarget.name) return { ...c, stats: { ...c.stats, military: clamp(c.stats.military + 10) } };
            return c;
        });
        commandDesc = `LOGISTIQUE: ${conqueror.name} envoie du matériel militaire à ${commandTarget.name}.`;

     } else if (commandAction === 'Frappe Nucléaire' && commandTarget) {
        // IMPACT CIBLE: -30 Eco, -40 Mil, -40 Pop
        updatedCountries = updatedCountries.map(c => {
            if (c.name === commandTarget.name) {
                return {
                    ...c,
                    stats: {
                        ...c.stats,
                        economy: clamp(c.stats.economy - 30),
                        military: clamp(c.stats.military - 40),
                        population: clamp(c.stats.population - 40)
                    }
                };
            }
            return c;
        });
        commandDesc = `APOCALYPSE: ${conqueror.name} a lancé une frappe nucléaire sur ${commandTarget.name}. Dévastation totale confirmée.`;

     } else if (commandAction === 'Blocus Économique' && commandTarget) {
        // IMPACT: Entre -10 et -30 Eco selon l'Eco de l'attaquant
        // Formule: Base 10 + (EcoAttaquant / 100 * 20) -> Si Eco=100, Bonus=20, Total=30.
        const damage = Math.floor(10 + (conqueror.stats.economy / 100 * 20));
        
        updatedCountries = updatedCountries.map(c => {
            if (c.name === commandTarget.name) {
                return { ...c, stats: { ...c.stats, economy: clamp(c.stats.economy - damage) } };
            }
            return c;
        });
        commandDesc = `GUERRE ÉCONOMIQUE: Blocus imposé par ${conqueror.name}. L'économie de ${commandTarget.name} s'effondre de -${damage}%.`;

     } else if (commandAction === 'Sabotage' && commandTarget) {
        // IMPACT: -5 Militaire sur la cible
        updatedCountries = updatedCountries.map(c => {
            if (c.name === commandTarget.name) {
                return { ...c, stats: { ...c.stats, military: clamp(c.stats.military - 5) } };
            }
            return c;
        });
        commandDesc = `ESPIONNAGE: Sabotage réussi des infrastructures militaires de ${commandTarget.name} (-5%).`;

     } else if (commandAction === 'Amis' && commandTarget) {
        // ACTION AMIS : Bonus économique mutuel + Narrative
        updatedCountries = updatedCountries.map(c => {
            if (c.name === conqueror.name || c.name === commandTarget.name) {
                const newEco = Math.min(100, c.stats.economy + 5); // +5% économie
                return { ...c, stats: { ...c.stats, economy: newEco } };
            }
            return c;
        });
        commandDesc = `DIPLOMATIE: Traité d'amitié et de coopération économique signé entre ${conqueror.name} et ${commandTarget.name}.`;

     } else {
        // Actions sans changement structurel immédiat (Declarer Ennemi, etc.)
        commandDesc = `ORDRE: ${commandSources.map(s => s.name).join(', ')} exécute ${commandAction} ${commandTarget ? `sur ${commandTarget.name}` : ''}.`;
     }

     setGameState(prev => ({ 
         ...prev, 
         countries: updatedCountries,
         alliances: updatedAlliances,
         selectedCountryId: null // DÉSÉLECTIONNER LE PAYS APRÈS UNE ACTION
     }));
     
     setPlayerActions(prev => [...prev, commandDesc]);
     
     // RESET COMPLET DE L'INTERFACE DE COMMANDE
     setCommandSources([]);
     setCommandTarget(null);
     setIsCommandMode(false);
     setCommandAction(ACTIONS[0].id); // Retour à l'action par défaut
     setActiveCommandSlot('source');
  };

  const handleNextTurn = async () => {
    if (gameState.isSimulating) return;

    // BLOCAGE: Au moins 1 action requise
    if (playerActions.length === 0) {
        return;
    }

    setGameState(prev => ({ ...prev, isSimulating: true }));
    
    // TELEMETRIE: Envoi des actions en background (fire and forget)
    trackGameStats(playerActions).catch(console.error);

    try {
      const result = await simulateTurn(
          gameState.turn, 
          gameState.countries, 
          playerActions, 
          gameState.events
      );
      
      const newEvents: GameEvent[] = result.events.map(desc => ({ turn: gameState.turn, description: desc }));
      setPendingEvents(newEvents);
      
      setGameState(prev => {
        const updatedCountries = prev.countries.map(country => {
            const updates = result.statUpdates[country.name];
            if (updates) {
                return { ...country, stats: { ...country.stats, ...updates } };
            }
            return country;
        });

        return { 
          ...prev, 
          turn: prev.turn + 1, 
          countries: updatedCountries,
          events: [...prev.events, ...newEvents], 
          tokensUsed: (prev.tokensUsed || 0) + result.tokenUsage,
          isSimulating: false,
          turnModifications: {}, // RESET des modifications manuelles pour le nouveau tour
        };
      });

      setPlayerActions([]);
    } catch (e) { 
        setGameState(prev => ({ ...prev, isSimulating: false })); 
        console.error(e);
    }
  };

  const handleSaveGame = async () => {
    if (!user) return;
    setIsSettingsOpen(false);
    const saveName = `Partie ${saves.length + 1} (Tour ${gameState.turn})`;
    
    try {
      const newSave = await saveGameToFirestore(user.uid, gameState, saveName);
      setSaves(prev => [newSave, ...prev]);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const handleDeleteSave = async (saveId: string) => {
    if (!user) return;
    try {
      await deleteSaveFromFirestore(user.uid, saveId);
      setSaves(prev => prev.filter(s => s.id !== saveId));
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const handleLoadGame = (saveId: string) => {
    const saveToLoad = saves.find(s => s.id === saveId);
    if (saveToLoad && saveToLoad.gameState) {
      setGameState(saveToLoad.gameState);
      setView('GAME');
    }
  };

  const handleNewGame = () => {
    setGameState({
      turn: 1,
      countries: INITIAL_COUNTRIES,
      alliances: INITIAL_ALLIANCES,
      events: [],
      selectedCountryId: null,
      isSimulating: false,
      gameOver: false,
      tokensUsed: 0,
      turnModifications: {},
    });
    setView('GAME');
  };

  const handleLeaderChange = (allianceId: string, newLeaderId: string) => {
    setGameState(prev => ({
      ...prev,
      alliances: prev.alliances.map(a => 
        a.id === allianceId ? { ...a, leaderId: newLeaderId } : a
      )
    }));
  };

  const canPassTurn = playerActions.length > 0;

  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-300" size={40} />
      </div>
    );
  }

  if (view === 'HOME') return <><Home onStart={() => setIsLoginModalOpen(true)} /><LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} /></>;
  
  if (view === 'HUB' && user) return (
    <Hub 
      user={user} 
      saves={saves.map(s => ({ ...s, turn: s.gameState.turn }))} 
      onNewGame={handleNewGame} 
      onLoadGame={handleLoadGame} 
      onDeleteSave={handleDeleteSave} 
      onLogout={handleLogout} 
    />
  );

  const selectedCountry = gameState.countries.find(c => c.name === gameState.selectedCountryId);

  return (
    <div className="flex flex-col h-screen max-h-screen w-full bg-white text-slate-900 overflow-hidden font-sans animate-fadeIn">
      {pendingEvents.length > 0 && <EventCard event={pendingEvents[0]} onNext={() => setPendingEvents(p => p.slice(1))} isLast={pendingEvents.length === 1} />}
      <EventLog events={gameState.events} isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveGame} 
        onLoad={() => setView('HUB')} 
        onHub={() => setView('HUB')} 
        onQuit={() => setView('HOME')} 
      />
      {mapViewMode === 'alliances' && (
        <AllianceOverlay 
          alliances={gameState.alliances} 
          countries={gameState.countries} 
          onLeaderChange={handleLeaderChange} 
        />
      )}

      {isCommandMode && (
        <CommandBar 
          sources={commandSources} 
          target={commandTarget} 
          action={commandAction} 
          onActionChange={setCommandAction} 
          activeSlot={activeCommandSlot} 
          onSlotClick={setActiveCommandSlot} 
          onExecute={handleExecuteCommand} 
          onCancel={() => {
              setIsCommandMode(false);
              setCommandSources([]);
              setCommandTarget(null);
              setGameState(prev => ({ ...prev, selectedCountryId: null })); // DÉSÉLECTIONNER LE PAYS LORS DE L'ANNULATION
          }} 
        />
      )}
      
      <header className="h-20 border-b border-slate-100 bg-white/95 flex items-center justify-between px-8 backdrop-blur-md z-10 relative shadow-sm flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <Globe size={24} className="animate-spin-slow" />
            </div>
            <h1 className="text-2xl md:text-3xl font-tech font-bold text-slate-900 tracking-tighter uppercase cursor-default">
              WORLD<span className="text-blue-600">DOWN</span>
            </h1>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors font-bold text-xs uppercase tracking-wider"
          >
            <Settings size={16} />
            Paramètres
          </button>
        </div>

        <div className="flex items-center gap-8">
            <div className="flex flex-col items-end border-r border-slate-100 pr-6 mr-0">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Tokens</span>
                <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-slate-400" />
                    <span className="font-tech text-slate-700 font-bold text-2xl">{gameState.tokensUsed}</span>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Temps Mondial</span>
                <span className="font-tech text-blue-600 font-bold text-2xl">TOUR {gameState.turn}</span>
            </div>
            <button 
                onClick={handleNextTurn} 
                disabled={gameState.isSimulating || !canPassTurn} 
                className={`
                    flex items-center gap-3 px-6 py-3 font-tech font-bold uppercase rounded-2xl shadow-xl transition-all text-xs
                    ${!canPassTurn 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                        : 'bg-blue-600 text-white shadow-blue-50 hover:bg-blue-700 active:scale-95'
                    }
                `}
            >
                {gameState.isSimulating ? <Loader2 className="animate-spin" size={18} /> : (!canPassTurn ? <AlertCircle size={16} /> : <Play fill="currentColor" size={16} />)}
                {gameState.isSimulating ? 'Calcul...' : (!canPassTurn ? 'Action Requise' : 'TOUR SUIVANT')}
            </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative bg-slate-50">
        <div className="absolute bottom-6 left-6 z-30 flex items-end gap-4">
            <button onClick={() => setIsHistoryOpen(true)} className="bg-white text-slate-900 border border-slate-100 p-3 rounded-2xl shadow-2xl hover:bg-slate-50 transition-all group flex items-center gap-3">
                <History size={24} /><span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Historique</span>
            </button>
            <button onClick={() => setIsCommandMode(true)} className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl hover:bg-black transition-all group flex items-center gap-3">
                <Swords size={24} /><span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Actions</span>
            </button>
            <button 
              onClick={() => setMapViewMode(prev => prev === 'political' ? 'alliances' : 'political')} 
              className={`p-3 rounded-2xl shadow-2xl transition-all group flex items-center gap-3 border ${mapViewMode === 'alliances' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-900 border-slate-100 hover:bg-slate-50'}`}
            >
                <Eye size={24} /><span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">{mapViewMode === 'political' ? 'Vue Politique' : 'Vue Alliances'}</span>
            </button>
        </div>

        <div className="flex-1 flex items-center justify-center bg-white h-full relative">
            <Map 
                countries={gameState.countries} 
                alliances={gameState.alliances} 
                selectedCountryId={gameState.selectedCountryId} 
                onSelectCountry={handleCountrySelect} 
                commandSources={commandSources} 
                commandTarget={commandTarget} 
                viewMode={mapViewMode} 
                commandAction={commandAction} 
            />
        </div>

        <div className={`absolute top-6 bottom-6 right-6 w-[360px] transition-transform duration-700 ease-out z-20 ${gameState.selectedCountryId && !isCommandMode ? 'translate-x-0' : 'translate-x-[130%]'}`}>
             <CountryPanel 
                country={selectedCountry} 
                allCountries={gameState.countries} 
                lockedStats={gameState.turnModifications[selectedCountry?.name || ''] || []}
                onStatChange={handleStatChange} 
                onToggleCapability={handleToggleCapability} 
                onOpenCommand={() => setIsCommandMode(true)} 
                onClose={() => setGameState(prev => ({ ...prev, selectedCountryId: null }))} 
                className="h-full rounded-[2rem] border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.06)]" 
             />
        </div>
      </main>
    </div>
  );
}