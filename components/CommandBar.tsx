import React from 'react';
import { Swords, ShieldAlert, Ban, Handshake, Skull, CheckCircle, X, MousePointerClick, ChevronDown, ShieldCheck, LogIn, LogOut, Radiation, Flag, Landmark, HeartHandshake } from 'lucide-react';
import { Country } from '../types';

interface CommandBarProps {
  sources: Country[];
  target: Country | null;
  action: string;
  onActionChange: (a: string) => void;
  activeSlot: 'source' | 'target';
  onSlotClick: (slot: 'source' | 'target') => void;
  onExecute: () => void;
  onCancel: () => void;
}

export const ACTIONS = [
  { id: 'Attaque Militaire', label: 'Attaque', icon: Swords, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'Annexer', label: 'Annexer', icon: Landmark, color: 'text-rose-900', bg: 'bg-rose-100' },
  { id: 'Soutien Militaire', label: 'Soutien Militaire', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'Frappe Nucléaire', label: 'Frappe Nucléaire', icon: Radiation, color: 'text-orange-600', bg: 'bg-orange-950 text-orange-500' },
  { id: 'Coloniser', label: 'Coloniser (Terre Brûlée)', icon: Flag, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'Blocus Économique', label: 'Blocus', icon: Ban, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'Sabotage', label: 'Sabotage', icon: ShieldAlert, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'Alliance', label: 'Créer Alliance', icon: Handshake, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Rejoindre Alliance', label: 'Rejoindre Alliance', icon: LogIn, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'Quitter Alliance', label: 'Quitter Alliance', icon: LogOut, color: 'text-slate-600', bg: 'bg-slate-50' },
  { id: 'Amis', label: 'Amis', icon: HeartHandshake, color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 'Déclarer Ennemi', label: 'Ennemi', icon: Skull, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export default function CommandBar({ 
  sources, 
  target, 
  action, 
  onActionChange, 
  activeSlot, 
  onSlotClick, 
  onExecute, 
  onCancel 
}: CommandBarProps) {
  
  const selectedActionData = ACTIONS.find(a => a.id === action) || ACTIONS[0];
  
  // Actions that DO NOT require a target
  const noTargetNeeded = action === 'Alliance' || action === 'Quitter Alliance';

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 flex items-stretch gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-slate-300 animate-slideDown">
      
      {/* 1. Source Slot */}
      <div 
        onClick={() => onSlotClick('source')}
        className={`
          w-48 flex flex-col justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all relative group
          ${activeSlot === 'source' 
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}
        `}
      >
        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
          <MousePointerClick size={10} /> Source (Pays A)
        </span>
        <div className="font-tech font-bold text-slate-800 text-sm truncate">
          {sources.length === 0 && <span className="text-slate-400 italic">Sélectionner sur la carte...</span>}
          {sources.length === 1 && sources[0].name}
          {sources.length > 1 && `${sources[0].name} +${sources.length - 1}`}
        </div>
        {activeSlot === 'source' && (
           <div className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-white bg-blue-600 rounded px-1 py-0.5 animate-bounce">
             Cliquez sur la carte
           </div>
        )}
      </div>

      {/* 2. Action Dropdown */}
      <div className="relative w-48">
         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <selectedActionData.icon size={16} className={selectedActionData.color} />
         </div>
         <select
            value={action}
            onChange={(e) => onActionChange(e.target.value)}
            className="w-full h-full pl-10 pr-8 py-2 appearance-none bg-white border-2 border-slate-200 rounded-lg font-bold text-sm text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 cursor-pointer truncate"
         >
             {ACTIONS.map(a => (
                 <option key={a.id} value={a.id}>{a.label}</option>
             ))}
         </select>
         <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
            <ChevronDown size={14} />
         </div>
      </div>

      {/* 3. Target Slot (Hidden for non-target actions) */}
      {!noTargetNeeded && (
        <div 
            onClick={() => onSlotClick('target')}
            className={`
            w-48 flex flex-col justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all relative
            ${activeSlot === 'target' 
                ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}
            `}
        >
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
            <MousePointerClick size={10} /> Cible (Pays B)
            </span>
            <div className="font-tech font-bold text-slate-800 text-sm truncate">
            {target ? target.name : <span className="text-slate-400 italic">Sélectionner sur la carte...</span>}
            </div>
            {activeSlot === 'target' && (
            <div className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-white bg-red-600 rounded px-1 py-0.5 animate-bounce">
                Cliquez sur la carte
            </div>
            )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
        <button 
            onClick={onCancel}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Annuler"
        >
            <X size={20} />
        </button>
        <button 
            onClick={onExecute}
            disabled={sources.length === 0 || (!target && !noTargetNeeded)}
            className="p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Exécuter l'Ordre"
        >
            <CheckCircle size={20} />
        </button>
      </div>

    </div>
  );
}