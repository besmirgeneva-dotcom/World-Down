import React from 'react';
import { GameEvent } from '../types';
import { ArrowRight, Globe, AlertTriangle } from 'lucide-react';

interface EventCardProps {
  event: GameEvent;
  onNext: () => void;
  isLast: boolean;
}

export default function EventCard({ event, onNext, isLast }: EventCardProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 transform transition-all animate-slideUp">
        {/* Header */}
        <div className="bg-slate-800 p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-full shadow-lg text-white animate-pulse">
            <Globe size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-tech font-bold text-white tracking-widest uppercase">
              Rapport Mondial
            </h2>
            <span className="text-blue-200 font-mono text-sm">TOUR {event.turn}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-start gap-4 mb-6">
             <AlertTriangle className="text-orange-500 shrink-0 mt-1" size={24} />
             <p className="text-lg text-slate-700 leading-relaxed font-medium">
               {event.description}
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={onNext}
            className="group flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95"
          >
            {isLast ? "TERMINER LE RAPPORT" : "ÉVÈNEMENT SUIVANT"}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}