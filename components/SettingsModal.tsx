import React from 'react';
import { Save, LogOut, LayoutGrid, Power, X, Upload } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: () => void; // Redirige vers le Hub pour l'instant car c'est là que sont les sauvegardes
  onHub: () => void;
  onQuit: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSave, onLoad, onHub, onQuit }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-slideUp">
        
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-tech font-bold text-slate-900 uppercase tracking-widest">Système</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <button 
            onClick={onSave}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group text-left"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm text-slate-500 group-hover:text-blue-600">
                <Save size={20} />
            </div>
            <div>
                <span className="block font-bold text-slate-800 text-sm uppercase">Sauvegarder</span>
                <span className="text-[10px] text-slate-400 font-medium">Enregistrer l'état actuel</span>
            </div>
          </button>

          <button 
            onClick={onHub}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all group text-left"
          >
             <div className="p-2 bg-white rounded-lg shadow-sm text-slate-500 group-hover:text-indigo-600">
                <LayoutGrid size={20} />
            </div>
            <div>
                <span className="block font-bold text-slate-800 text-sm uppercase">Retour au Hub</span>
                <span className="text-[10px] text-slate-400 font-medium">Gérer les parties</span>
            </div>
          </button>

          <div className="h-px bg-slate-100 my-2"></div>

          <button 
            onClick={onQuit}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 hover:text-red-800 transition-all group text-left"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm text-red-400 group-hover:text-red-600">
                <Power size={20} />
            </div>
            <div>
                <span className="block font-bold text-red-700 text-sm uppercase">Quitter</span>
                <span className="text-[10px] text-red-400 font-medium">Fermer la session</span>
            </div>
          </button>
        </div>
        
        <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
            <span className="text-[9px] text-slate-400 font-mono">WORLD DOWN SYSTEM v1.0</span>
        </div>
      </div>
    </div>
  );
}