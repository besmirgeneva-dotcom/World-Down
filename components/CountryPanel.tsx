import React from 'react';
import { Country, StatType } from '../types';
import { TrendingUp, TrendingDown, Shield, Users, DollarSign, X, Radiation, Rocket, Swords } from 'lucide-react';

interface CountryPanelProps {
  country: Country | undefined;
  allCountries: Country[];
  onStatChange: (countryId: string, stat: StatType, delta: number) => void;
  onToggleCapability: (countryId: string, capability: 'hasNuclear' | 'hasSpaceProgram') => void;
  onOpenCommand: (sourceId: string) => void;
  onClose: () => void;
  className?: string;
}

const StatRow = ({ 
  label, 
  value, 
  icon: Icon, 
  colorClass, 
  onInc, 
  onDec 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  colorClass: string; 
  onInc: () => void; 
  onDec: () => void; 
}) => (
  <div className="flex items-center justify-between mb-4 p-3 bg-white/50 rounded-lg border border-slate-200 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full bg-white shadow-sm ${colorClass}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</p>
        <div className="h-2 w-24 bg-slate-200 rounded-full mt-1 overflow-hidden">
            <div className={`h-full ${colorClass.replace('text-', 'bg-')}`} style={{ width: `${value}%` }}></div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
        <span className={`text-xl font-mono font-bold w-10 text-right ${colorClass}`}>{value}</span>
        <div className="flex flex-col gap-1">
            <button onClick={onInc} className="p-1 hover:bg-slate-200 rounded text-green-600 transition-colors">
                <TrendingUp size={16} />
            </button>
            <button onClick={onDec} className="p-1 hover:bg-slate-200 rounded text-red-600 transition-colors">
                <TrendingDown size={16} />
            </button>
        </div>
    </div>
  </div>
);

const CapabilityToggle = ({
  label,
  active,
  icon: Icon,
  colorClass,
  onToggle
}: {
  label: string;
  active: boolean;
  icon: any;
  colorClass: string;
  onToggle: () => void;
}) => (
  <div 
    onClick={onToggle}
    className={`
      cursor-pointer flex items-center justify-between p-3 rounded-lg border transition-all duration-300
      ${active ? 'bg-white border-slate-300 shadow-md' : 'bg-slate-100/50 border-transparent opacity-70 grayscale hover:grayscale-0'}
    `}
  >
    <div className="flex items-center gap-3">
       <div className={`p-2 rounded-full ${active ? 'bg-slate-100' : 'bg-slate-200'} ${colorClass}`}>
         <Icon size={18} />
       </div>
       <span className={`font-bold text-sm ${active ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
    </div>
    <div className={`
      w-10 h-5 rounded-full relative transition-colors duration-300
      ${active ? 'bg-green-500' : 'bg-slate-300'}
    `}>
      <div className={`
        absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm
        ${active ? 'left-6' : 'left-1'}
      `}></div>
    </div>
  </div>
);

const CountryPanel: React.FC<CountryPanelProps> = ({ country, allCountries, onStatChange, onToggleCapability, onOpenCommand, onClose, className }) => {
  if (!country) return null;

  return (
    <div className={`bg-white/80 backdrop-blur-xl border-l border-white/50 p-6 flex flex-col h-full shadow-2xl ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
            <h2 className="text-3xl font-tech text-slate-800 uppercase tracking-widest">{country.name}</h2>
            <p className="text-slate-500 text-sm font-mono">Administration Globale</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Indicateurs Principaux</h3>
        <StatRow 
            label="Économie" 
            value={country.stats.economy} 
            icon={DollarSign} 
            colorClass="text-emerald-600"
            onInc={() => onStatChange(country.name, StatType.ECONOMY, 5)}
            onDec={() => onStatChange(country.name, StatType.ECONOMY, -5)}
        />
        <StatRow 
            label="Militaire" 
            value={country.stats.military} 
            icon={Shield} 
            colorClass="text-rose-600"
            onInc={() => onStatChange(country.name, StatType.MILITARY, 5)}
            onDec={() => onStatChange(country.name, StatType.MILITARY, -5)}
        />
        <StatRow 
            label="Population" 
            value={country.stats.population} 
            icon={Users} 
            colorClass="text-blue-600"
            onInc={() => onStatChange(country.name, StatType.POPULATION, 5)}
            onDec={() => onStatChange(country.name, StatType.POPULATION, -5)}
        />

        <div className="my-6 border-t border-slate-200"></div>

        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Capacités Stratégiques</h3>
        <div className="space-y-3">
          <CapabilityToggle 
            label="Arsenal Nucléaire"
            active={country.stats.hasNuclear}
            icon={Radiation}
            colorClass="text-orange-600"
            onToggle={() => onToggleCapability(country.name, 'hasNuclear')}
          />
          <CapabilityToggle 
            label="Programme Spatial"
            active={country.stats.hasSpaceProgram}
            icon={Rocket}
            colorClass="text-indigo-600"
            onToggle={() => onToggleCapability(country.name, 'hasSpaceProgram')}
          />
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-200">
           <button 
             onClick={() => onOpenCommand(country.name)}
             className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-tech font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
           >
             <Swords size={18} />
             Actions Stratégiques
           </button>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600 shadow-inner">
            <h3 className="font-bold text-slate-800 mb-2">Rapport d'Intelligence</h3>
            <p className="leading-relaxed text-xs">
                {country.stats.military > 80 && country.stats.hasNuclear && "⚠️ Superpuissance militaire nucléaire."}
                {country.stats.military > 80 && !country.stats.hasNuclear && "⚠️ Force conventionnelle massive, vulnérable à la dissuasion."}
                {country.stats.economy < 20 && "⚠️ Risque d'effondrement économique imminent."}
                {country.stats.population > 90 && "⚠️ Crise démographique potentielle."}
                {country.stats.hasSpaceProgram && country.stats.economy > 60 && "🚀 Capacité de projection technologique avancée."}
                {!country.stats.hasNuclear && !country.stats.hasSpaceProgram && country.stats.military < 50 && "Pays neutre ou en développement."}
            </p>
        </div>
      </div>
    </div>
  );
};

export default CountryPanel;