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
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Globe, Play, Loader2, Swords, History, Users, Settings, Eye, Cpu } from 'lucide-react';

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

export default function App() {
  const [view, setView] = useState<ViewMode>('HOME');
  const [user, setUser] = useState<{ uid: string; name: string; email: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Utilisation de GameSaveData qui inclut le gameState complet
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

  // Monitor Firebase Auth State
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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

  // Charger les sauvegardes quand on arrive sur le HUB
  useEffect(() => {
    if (user && view === 'HUB') {
      setIsLoadingSaves(true);
      getUserSaves(user.uid)
        .then(fetchedSaves => setSaves(fetchedSaves))
        .catch(console.error)
        .finally(() => setIsLoadingSaves(false));
    }
  }, [user, view]);

  // Auto-switch view mode based on action, but allows manual override now
  useEffect(() => {
    if (['Alliance', 'Rejoindre Alliance', 'Quitter Alliance'].includes(commandAction)) {
      setMapViewMode('alliances');
    }
  }, [commandAction]);

  const handleLogin = (userData: { name: string; email: string }) => {
    // Note: The actual user setting happens in onAuthStateChanged
    setIsLoginModalOpen(false);
    setView('HUB');
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setSaves([]); // Vider les sauvegardes locales
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleCountrySelect = (id: string) => {
    let country = gameState.countries.find(c => c.name === id);
    if (!country) {
       country = { id, name: id, stats: { economy: 50, military: 50, population: 50, hasNuclear: false, hasSpaceProgram: false } };
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
      } else setCommandTarget(country || null);
    } else setGameState(prev => ({ ...prev, selectedCountryId: effectiveOwnerId }));
  };

  const handleExecuteCommand = () => {
     if (commandSources.length === 0) return;
     const conqueror = commandSources[0];
     let updatedCountries = [...gameState.countries];
     let commandDesc = "";

     if (commandAction === 'Annexer' && commandTarget) {
        updatedCountries = updatedCountries.map(c => c.name === commandTarget.name ? { ...c, ownerId: conqueror.name, isDestroyed: false } : c);
        commandDesc = `CONQUÊTE: ${conqueror.name} a annexé ${commandTarget.name}.`;
     } else {
        commandDesc = `ORDRE: ${commandSources.map(s => s.name).join(', ')} exécute ${commandAction}.`;
     }

     setGameState(prev => ({ ...prev, countries: updatedCountries }));
     setPlayerActions(prev => [...prev, commandDesc]);
     setIsCommandMode(false);
  };

  const handleNextTurn = async () => {
    if (gameState.isSimulating) return;
    setGameState(prev => ({ ...prev, isSimulating: true }));
    try {
      const result = await simulateTurn(gameState.turn, gameState.countries, playerActions, gameState.events);
      const newEvents: GameEvent[] = result.events.map(desc => ({ turn: gameState.turn, description: desc }));
      setPendingEvents(newEvents);
      setGameState(prev => ({ 
          ...prev, 
          turn: prev.turn + 1, 
          events: [...prev.events, ...newEvents], 
          tokensUsed: (prev.tokensUsed || 0) + result.tokenUsage,
          isSimulating: false 
      }));
      setPlayerActions([]);
    } catch (e) { setGameState(prev => ({ ...prev, isSimulating: false })); }
  };

  const handleSaveGame = async () => {
    if (!user) return;
    
    // Fermer la modal immédiatement pour UX
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
      tokensUsed: 0
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

  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-300" size={40} />
      </div>
    );
  }

  if (view === 'HOME') return <><Home onStart={() => setIsLoginModalOpen(true)} /><LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} /></>;
  
  // Transformation des GameSaveData en format simple pour le Hub (turn mapping)
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
      {/* Affichage conditionnel de l'Overlay d'Alliance */}
      {mapViewMode === 'alliances' && (
        <AllianceOverlay 
          alliances={gameState.alliances} 
          countries={gameState.countries} 
          onLeaderChange={handleLeaderChange} 
        />
      )}

      {isCommandMode && <CommandBar sources={commandSources} target={commandTarget} action={commandAction} onActionChange={setCommandAction} activeSlot={activeCommandSlot} onSlotClick={setActiveCommandSlot} onExecute={handleExecuteCommand} onCancel={() => setIsCommandMode(false)} />}
      
      <header className="h-20 border-b border-slate-100 bg-white/95 flex items-center justify-between px-8 backdrop-blur-md z-10 relative shadow-sm flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <Globe size={24} className="animate-spin-slow" />
            </div>
            {/* Suppression du onClick sur le titre */}
            <h1 className="text-2xl md:text-3xl font-tech font-bold text-slate-900 tracking-tighter uppercase cursor-default">
              WORLD<span className="text-blue-600">DOWN</span>
            </h1>
          </div>
          
          {/* Bouton Paramètres */}
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
            <button onClick={handleNextTurn} disabled={gameState.isSimulating} className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-tech font-bold uppercase rounded-2xl shadow-xl shadow-blue-50 hover:bg-blue-700 transition-all active:scale-95 text-xs">
                {gameState.isSimulating ? <Loader2 className="animate-spin" size={18} /> : <Play fill="currentColor" size={16} />}
                {gameState.isSimulating ? 'Calcul...' : 'TOUR SUIVANT'}
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
            {/* Bouton Toggle Vue Politique/Alliance */}
            <button 
              onClick={() => setMapViewMode(prev => prev === 'political' ? 'alliances' : 'political')} 
              className={`p-3 rounded-2xl shadow-2xl transition-all group flex items-center gap-3 border ${mapViewMode === 'alliances' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-900 border-slate-100 hover:bg-slate-50'}`}
            >
                <Eye size={24} /><span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">{mapViewMode === 'political' ? 'Vue Politique' : 'Vue Alliances'}</span>
            </button>
        </div>

        <div className="flex-1 flex items-center justify-center bg-white h-full relative">
            <Map countries={gameState.countries} alliances={gameState.alliances} selectedCountryId={gameState.selectedCountryId} onSelectCountry={handleCountrySelect} commandSources={commandSources} commandTarget={commandTarget} viewMode={mapViewMode} />
        </div>

        <div className={`absolute top-6 bottom-6 right-6 w-[360px] transition-transform duration-700 ease-out z-20 ${gameState.selectedCountryId && !isCommandMode ? 'translate-x-0' : 'translate-x-[130%]'}`}>
             <CountryPanel country={selectedCountry} allCountries={gameState.countries} onStatChange={() => {}} onToggleCapability={() => {}} onOpenCommand={() => setIsCommandMode(true)} onClose={() => setGameState(prev => ({ ...prev, selectedCountryId: null }))} className="h-full rounded-[2rem] border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.06)]" />
        </div>
      </main>
    </div>
  );
}