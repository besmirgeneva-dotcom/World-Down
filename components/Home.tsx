import React from 'react';
import { Globe, Play, ChevronRight, Swords, Landmark, TrendingUp } from 'lucide-react';

interface HomeProps {
  onStart: () => void;
}

export default function Home({ onStart }: HomeProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-y-auto relative flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-50 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-20"></div>
      </div>

      <div className="max-w-5xl z-10 space-y-12">
        <div className="flex flex-col items-center gap-6">
            <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
                <Globe size={100} className="text-blue-600 animate-spin-slow" />
            </div>
            <h1 className="text-8xl md:text-[10rem] font-tech font-bold tracking-tighter text-slate-900 leading-none">
                WORLD<span className="text-blue-600">DOWN</span>
            </h1>
            <div className="px-8 py-2 bg-slate-900 text-white rounded-full">
                <span className="text-xs font-tech font-bold uppercase tracking-[0.4em]">Overlord Interface v1.0</span>
            </div>
        </div>

        <p className="text-2xl md:text-4xl text-slate-500 font-medium leading-tight max-w-3xl mx-auto">
            L'échiquier mondial attend son <span className="text-slate-900 font-bold">Maître</span>. 
            Prenez les rênes de l'histoire et unifiez le monde sous votre bannière.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-16 py-8">
            <div className="flex flex-col items-center gap-4">
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <Swords className="text-slate-900" size={32} />
                </div>
                <span className="text-[11px] uppercase font-black tracking-[0.3em] text-slate-400">Tactique</span>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <Landmark className="text-slate-900" size={32} />
                </div>
                <span className="text-[11px] uppercase font-black tracking-[0.3em] text-slate-400">Politique</span>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <TrendingUp className="text-slate-900" size={32} />
                </div>
                <span className="text-[11px] uppercase font-black tracking-[0.3em] text-slate-400">Domination</span>
            </div>
        </div>

        <div className="flex flex-col items-center gap-6">
            <button 
                onClick={onStart}
                className="group relative inline-flex items-center gap-6 px-16 py-8 bg-blue-600 text-white font-tech font-bold text-3xl uppercase rounded-[2.5rem] hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-[0_30px_60px_rgba(37,99,235,0.4)]"
            >
                <Play fill="currentColor" size={32} />
                JOUER MAINTENANT
                <ChevronRight className="group-hover:translate-x-2 transition-transform" />
            </button>
        </div>
      </div>

      <footer className="mt-auto pt-20 text-[11px] text-slate-300 font-tech tracking-[0.5em] uppercase">
        © 2025 WORLD DOWN PROTOCOL • ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}