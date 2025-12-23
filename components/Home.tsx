import React from 'react';
import { Globe, Play, ChevronRight, Swords, Landmark, TrendingUp } from 'lucide-react';

interface HomeProps {
  onStart: () => void;
}

export default function Home({ onStart }: HomeProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-y-auto relative flex flex-col items-center justify-center p-4 md:p-8 text-center animate-in fade-in duration-700">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
      </div>

      <div className="max-w-4xl z-10 space-y-8 py-10">
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 md:p-6 rounded-[2rem] bg-white border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.05)]">
                <Globe size={60} className="text-blue-600 animate-spin-slow" />
            </div>
            <h1 className="text-6xl md:text-8xl font-tech font-bold tracking-tighter text-slate-900 leading-none">
                WORLD<span className="text-blue-600">DOWN</span>
            </h1>
            <div className="px-6 py-1 bg-slate-900 text-white rounded-full">
                <span className="text-[10px] font-tech font-bold uppercase tracking-[0.3em]">Overlord Interface v1.0</span>
            </div>
        </div>

        <p className="text-xl md:text-2xl text-slate-500 font-medium leading-snug max-w-2xl mx-auto">
            L'échiquier mondial attend son <span className="text-slate-900 font-bold">Maître</span>. 
            Prenez les rênes de l'histoire et unifiez le monde sous votre bannière.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 py-4">
            <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Swords className="text-slate-900" size={24} />
                </div>
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-400">Tactique</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Landmark className="text-slate-900" size={24} />
                </div>
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-400">Politique</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <TrendingUp className="text-slate-900" size={24} />
                </div>
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-400">Domination</span>
            </div>
        </div>

        <div className="flex flex-col items-center gap-4">
            <button 
                onClick={onStart}
                className="group relative inline-flex items-center gap-4 px-10 py-5 bg-blue-600 text-white font-tech font-bold text-xl md:text-2xl uppercase rounded-[2rem] hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)]"
            >
                <Play fill="currentColor" size={24} />
                JOUER MAINTENANT
                <ChevronRight className="group-hover:translate-x-2 transition-transform" />
            </button>
        </div>

        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-t border-slate-100">
            <div className="space-y-1">
                <h4 className="font-tech font-bold text-blue-600 text-[10px] uppercase tracking-widest">IA SOUVERAINE</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Gemini 3 Pro alimente chaque décision des nations ennemies.</p>
            </div>
            <div className="space-y-1">
                <h4 className="font-tech font-bold text-blue-600 text-[10px] uppercase tracking-widest">FRONT MATÉRIEL</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Gestion des ressources stratégiques et de la force brute.</p>
            </div>
            <div className="space-y-1">
                <h4 className="font-tech font-bold text-blue-600 text-[10px] uppercase tracking-widest">UNITÉ GLOBALE</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Fondez des alliances ou menez des guerres d'annexion.</p>
            </div>
        </div>
      </div>

      <footer className="mt-auto py-6 text-[9px] text-slate-300 font-tech tracking-[0.5em] uppercase">
        © 2025 WORLD DOWN PROTOCOL
      </footer>
    </div>
  );
}