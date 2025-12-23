import React from 'react';
import { User, Plus, Save, Trash2, LogOut, ChevronRight, Globe, BarChart3, Clock, AlertCircle } from 'lucide-react';

interface GameSave {
  id: string;
  name: string;
  turn: number;
  date: string;
  status: string;
}

interface HubProps {
  user: { name: string; email: string };
  saves: GameSave[];
  onNewGame: () => void;
  onLoadGame: (id: string) => void;
  onDeleteSave: (id: string) => void;
  onLogout: () => void;
}

export default function Hub({ user, saves, onNewGame, onLoadGame, onDeleteSave, onLogout }: HubProps) {
  // Calcul dynamique des statistiques
  const totalGames = saves.length;
  const totalTurns = saves.reduce((acc, save) => acc + save.turn, 0);

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-500">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 md:px-10 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
             <Globe size={28} />
           </div>
           <div>
             <h1 className="text-xl md:text-2xl font-tech font-bold text-slate-900 tracking-tight">HUB DE COMMANDE</h1>
             <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em]">Session Overlord Alpha</p>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                 <User size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-none">{user.name}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-medium">{user.email}</span>
              </div>
           </div>
           <button onClick={onLogout} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
             <LogOut size={20} />
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10 overflow-y-auto">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group">
                <h2 className="text-2xl font-tech font-bold text-slate-900 mb-2">Nouvelle Ère</h2>
                <p className="text-slate-400 text-sm mb-6 font-medium leading-relaxed">Initiez une nouvelle simulation mondiale.</p>
                <button 
                  onClick={onNewGame}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-tech font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  NOUVEAU JEU
                </button>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-tech font-bold text-slate-400 text-[9px] uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={14} className="text-blue-500" />
                    Statistiques
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Parties</span>
                        <span className="font-tech font-bold text-slate-900">{totalGames}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tours Joués</span>
                        <span className="font-tech font-bold text-slate-900">{totalTurns}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-tech font-bold text-slate-900 uppercase tracking-tight flex items-center gap-4">
                    <Save size={32} className="text-slate-200" />
                    Archives
                </h2>
                <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {saves.length} sauvegardes
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                {saves.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 gap-4">
                    <AlertCircle size={40} className="text-slate-200" />
                    <p className="font-medium text-sm">Aucune partie sauvegardée dans les archives.</p>
                  </div>
                )}
                {saves.map(save => (
                    <div key={save.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col justify-between h-[220px]">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{save.name}</h4>
                                <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                                    <Clock size={12} /> {save.date}
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              save.status === 'En Guerre' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                                {save.status}
                            </div>
                        </div>
                        
                        <div className="flex items-end justify-between mt-4">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Progression</span>
                                <span className="text-2xl font-tech font-bold text-slate-900">TOUR {save.turn}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onDeleteSave(save.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                  <Trash2 size={18} />
                                </button>
                                <button 
                                  onClick={() => onLoadGame(save.id)}
                                  className="flex items-center gap-3 px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
                                >
                                  CHARGER
                                  <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}