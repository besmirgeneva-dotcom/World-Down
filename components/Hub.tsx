import React from 'react';
import { User, Plus, Save, Trash2, LogOut, ChevronRight, Globe, BarChart3, Clock } from 'lucide-react';

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
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-500">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-12 py-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-200">
             <Globe size={36} />
           </div>
           <div>
             <h1 className="text-3xl font-tech font-bold text-slate-900 tracking-tight">HUB DE COMMANDE</h1>
             <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Session Overlord Alpha</p>
           </div>
        </div>

        <div className="flex items-center gap-10">
           <div className="flex items-center gap-5 bg-white px-6 py-3 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                 <User size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 leading-none">{user.name}</span>
                <span className="text-[11px] text-slate-400 mt-1 font-medium">{user.email}</span>
              </div>
           </div>
           <button onClick={onLogout} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Déconnexion">
             <LogOut size={26} />
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[3rem] p-12 shadow-[0_30px_60px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 p-10 opacity-[0.04] group-hover:scale-110 transition-transform duration-1000">
                    <Globe size={250} />
                </div>
                <h2 className="text-3xl font-tech font-bold text-slate-900 mb-4">Nouvelle Ère</h2>
                <p className="text-slate-400 text-base mb-10 font-medium leading-relaxed">Initiez une nouvelle simulation et redéfinissez l'équilibre mondial.</p>
                <button 
                  onClick={onNewGame}
                  className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-tech font-bold uppercase tracking-widest rounded-3xl shadow-2xl shadow-blue-100 flex items-center justify-center gap-4 transition-all active:scale-95"
                >
                  <Plus size={26} />
                  NOUVEAU JEU
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                <h3 className="font-tech font-bold text-slate-400 text-[11px] uppercase tracking-widest flex items-center gap-3">
                    <BarChart3 size={16} className="text-blue-500" />
                    Statistiques de Simulation
                </h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400 uppercase">Simulations</span>
                        <span className="font-tech font-bold text-slate-900 text-lg">1,240</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400 uppercase">Annexions</span>
                        <span className="font-tech font-bold text-slate-900 text-lg">482</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-3 space-y-10">
            <div className="flex items-center justify-between">
                <h2 className="text-4xl font-tech font-bold text-slate-900 uppercase tracking-tight flex items-center gap-6">
                    <Save size={40} className="text-slate-200" />
                    Archives Mondiales
                </h2>
                <div className="px-6 py-2 bg-slate-100 rounded-full text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  {saves.length} sauvegardes trouvées
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {saves.map(save => (
                    <div key={save.id} className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group flex flex-col justify-between h-[280px]">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{save.name}</h4>
                                <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                                    <Clock size={14} /> Sauvegardé {save.date}
                                </p>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              save.status === 'En Guerre' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                                {save.status}
                            </div>
                        </div>
                        
                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest block">Progression</span>
                                <span className="text-3xl font-tech font-bold text-slate-900">TOUR {save.turn}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => onDeleteSave(save.id)} className="p-5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-3xl transition-all">
                                  <Trash2 size={24} />
                                </button>
                                <button 
                                  onClick={() => onLoadGame(save.id)}
                                  className="flex items-center gap-4 px-10 py-5 bg-slate-900 hover:bg-black text-white font-bold rounded-[1.8rem] shadow-2xl shadow-slate-200 transition-all active:scale-95"
                                >
                                  CHARGER
                                  <ChevronRight size={22} />
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