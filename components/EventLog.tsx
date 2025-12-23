import React, { useRef, useEffect } from 'react';
import { GameEvent } from '../types';
import { Radio, X, History } from 'lucide-react';

interface EventLogProps {
  events: GameEvent[];
  isOpen: boolean;
  onClose: () => void;
}

const EventLog: React.FC<EventLogProps> = ({ events, isOpen, onClose }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
       {/* Container - Allow clicks inside, pass through outside handled by parent usually, but here we make a panel */}
       <div className="absolute bottom-20 left-4 w-[500px] h-[400px] pointer-events-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-slideUp">
          
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <History className="text-blue-600" size={20} />
                <h3 className="font-tech text-slate-800 uppercase tracking-wider font-bold">Archives Historiques</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm bg-slate-50/50">
            {events.length === 0 && (
                <div className="text-slate-400 italic text-center mt-12 flex flex-col items-center gap-2">
                    <Radio size={32} />
                    <span>En attente du début de l'histoire...</span>
                </div>
            )}
            {events.map((event, idx) => (
            <div key={idx} className="relative pl-6 pb-4 border-l-2 border-slate-300 last:border-0">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-blue-600 text-xs font-bold block mb-1">TOUR {event.turn}</span>
                    <span className="text-slate-700 leading-relaxed block">{event.description}</span>
                </div>
            </div>
            ))}
            <div ref={bottomRef} />
          </div>
       </div>
    </div>
  );
};

export default EventLog;