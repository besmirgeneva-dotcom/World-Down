import React, { useState, useEffect } from 'react';
import { Country } from '../types';
import { Swords, ShieldAlert, Ban, Handshake, Skull, X, CheckCircle, Crosshair } from 'lucide-react';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
  onExecute: (sourceIds: string[], action: string, targetId: string) => void;
  initialSourceId?: string | null;
}

const ACTIONS = [
  { id: 'Attaque Militaire', label: 'Attaque Militaire', icon: Swords, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'Blocus Économique', label: 'Blocus Économique', icon: Ban, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'Sabotage', label: 'Sabotage', icon: ShieldAlert, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'Alliance', label: 'Former Alliance', icon: Handshake, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Déclarer Ennemi', label: 'Déclarer Ennemi', icon: Skull, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export default function CommandModal({ isOpen, onClose, countries, onExecute, initialSourceId }: CommandModalProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>(ACTIONS[0].id);
  const [selectedTarget, setSelectedTarget] = useState<string>('');

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
        setSelectedSources(initialSourceId ? [initialSourceId] : []);
        setSelectedAction(ACTIONS[0].id);
        setSelectedTarget('');
    }
  }, [isOpen, initialSourceId]);

  if (!isOpen) return null;

  const toggleSource = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExecute = () => {
    if (selectedSources.length === 0 || !selectedTarget) return;
    onExecute(selectedSources, selectedAction, selectedTarget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-tech font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
            <Swords size={20} className="text-slate-800" />
            Commandement Stratégique
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* 1. Select Sources */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">1. Pays Acteurs (Sélection Multiple)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/50">
              {countries.map(country => (
                <label key={country.id} className={`
                  flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-all select-none
                  ${selectedSources.includes(country.name) 
                    ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'}
                `}>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={selectedSources.includes(country.name)}
                    onChange={() => toggleSource(country.name)}
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedSources.includes(country.name) ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                    {selectedSources.includes(country.name) && <CheckCircle size={10} className="text-white" />}
                  </div>
                  <span className="truncate font-medium">{country.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* 2. Select Action */}
             <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">2. Type d'Action</h3>
                <div className="space-y-2">
                  {ACTIONS.map(action => (
                    <div 
                      key={action.id}
                      onClick={() => setSelectedAction(action.id)}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${selectedAction === action.id 
                          ? `border-${action.color.split('-')[1]}-500 bg-white ring-2 ring-${action.color.split('-')[1]}-100 shadow-lg scale-[1.02]` 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className={`p-2 rounded-full ${action.bg} ${action.color}`}>
                        <action.icon size={18} />
                      </div>
                      <span className={`font-bold text-sm ${selectedAction === action.id ? 'text-slate-800' : 'text-slate-500'}`}>
                        {action.label}
                      </span>
                    </div>
                  ))}
                </div>
             </div>

             {/* 3. Select Target */}
             <div className="flex flex-col">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">3. Cible</h3>
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-2 overflow-y-auto max-h-60">
                    {countries.map(c => {
                       const isSource = selectedSources.includes(c.name);
                       const isSelected = selectedTarget === c.name;
                       return (
                        <button
                            key={c.id}
                            disabled={isSource}
                            onClick={() => setSelectedTarget(c.name)}
                            className={`
                                w-full text-left p-2 rounded-lg mb-1 flex items-center justify-between text-sm transition-colors
                                ${isSelected ? 'bg-slate-800 text-white shadow-md' : 'hover:bg-slate-200 text-slate-700'}
                                ${isSource ? 'opacity-30 cursor-not-allowed' : ''}
                            `}
                        >
                            <span>{c.name}</span>
                            {isSelected && <Crosshair size={14} />}
                        </button>
                       )
                    })}
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
             onClick={onClose}
             className="px-4 py-2 text-slate-500 font-bold uppercase text-xs hover:bg-slate-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button 
            onClick={handleExecute}
            disabled={selectedSources.length === 0 || !selectedTarget}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-tech font-bold uppercase tracking-wider rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
          >
            CONFIRMER L'ORDRE
            <CheckCircle size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}