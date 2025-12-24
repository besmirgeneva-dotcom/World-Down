import React from 'react';
import { Country, StatType } from '../types';
import { TrendingUp, TrendingDown, Shield, Users, DollarSign, X, Radiation, Rocket, Swords, Lock, AlertCircle } from 'lucide-react';

interface CountryPanelProps {
  country: Country | undefined;
  allCountries: Country[];
  lockedStats: StatType[];
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
  isLocked,
  onInc, 
  onDec 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  colorClass: string; 
  isLocked: boolean;
  onInc: () => void; 
  onDec: () => void; 
}) => (
  <div className={`flex items-center justify-between mb-3 p-2.5 rounded-xl border transition-colors ${isLocked ? 'bg-slate-100 border-slate-100 opacity-70' : 'bg-white/50 border-slate-200 shadow-sm'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-full shadow-sm ${isLocked ? 'bg-slate-200 text-slate-400' : `bg-white ${colorClass}`}`}>
        {isLocked ? <Lock size={14} /> : <Icon size={14} />}
      </div>
      <div>
        <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">{label}</p>
        <div className="h-1.5 w-16 bg-slate-200 rounded-full mt-1 overflow-hidden">
            <div className={`h-full ${isLocked ? 'bg-slate-400' : colorClass.replace('text-', 'bg-')}`} style={{ width: `${value}%` }}></div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
        <span className={`text-lg font-tech font-bold w-8 text-right ${isLocked ? 'text-slate-400' : colorClass}`}>{value}</span>
        <div className="flex flex-col gap-0.5">
            <button 
                onClick={onInc} 
                disabled={isLocked}
                className="p-0.5 hover:bg-slate-200 rounded text-green-600 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
            >
                <TrendingUp size={12} />
            </button>
            <button 
                onClick={onDec} 
                disabled={isLocked}
                className="p-0.5 hover:bg-slate-200 rounded text-red-600 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
            >
                <TrendingDown size={12} />
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
  disabled,
  onToggle
}: {
  label: string;
  active: boolean;
  icon: any;
  colorClass: string;
  disabled?: boolean;
  onToggle: () => void;
}) => (
  <div 
    onClick={(e) => {
        if (!disabled) {
            onToggle();
        }
    }}
    className={`
      flex items-center justify-between p-3 rounded-xl border transition-all duration-200 select-none
      ${disabled 
        ? 'bg-slate-100 border-slate-100 opacity-60 cursor-not-allowed' 
        : 'cursor-pointer hover:border-slate-300 hover:shadow-md'
      }
      ${active && !disabled ? 'bg-white border-slate-200 shadow-sm' : ''}
      ${!active && !disabled ? 'bg-slate-50 border-slate-200' : ''}
    `}
  >
    <div className="flex items-center gap-3">
       <div className={`p-2 rounded-full ${active && !disabled ? 'bg-slate-100' : 'bg-slate-200'} ${disabled ? 'text-slate-400' : colorClass}`}>
         {disabled ? <Lock size={16} /> : <Icon size={16} />}
       </div>
       <div className="flex flex-col">
          <span className={`font-bold text-xs ${active ? 'text-slate-900' : (disabled ? 'text-slate-400' : 'text-slate-600')}`}>
            {label}
          </span>
          {disabled && !active && (
             <span className="text-[9px] text-red-400 font-medium">Indisponible</span>
          )}
          {active && (
             <span className="text-[9px] text-green-600 font-bold uppercase tracking-wider">Actif</span>
          )}
       </div>
    </div>
    
    <div className={`
      w-10 h-5 rounded-full relative transition-colors duration-300
      ${active && !disabled ? 'bg-green-500' : (disabled ? 'bg-slate-200' : 'bg-slate-300')}
    `}>
      <div className={`
        absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm
        ${active ? 'left-6' : 'left-1'}
      `}></div>
    </div>
  </div>
);

const CountryPanel: React.FC<CountryPanelProps> = ({ country, allCountries, lockedStats, onStatChange, onToggleCapability, onOpenCommand, onClose, className }) => {
  if (!country) return null;

  // On vérifie si une capacité a déjà été modifiée ce tour ci (Nuclear ou Space présent dans lockedStats)
  const hasModifiedCapability = lockedStats.includes(StatType.NUCLEAR) || lockedStats.includes(StatType.SPACE);

  // Condition spécifique pour le nucléaire : Doit avoir le spatial OU l'avoir déjà (pour pouvoir le désactiver)
  const canModifyNuclear = !hasModifiedCapability && (country.stats.hasSpaceProgram || country.stats.hasNuclear);
  const canModifySpace = !hasModifiedCapability;

  return (
    <div className={`bg-white/90 backdrop-blur-xl border border-slate-200 p-6 flex flex-col h-full shadow-2xl overflow-hidden ${className}`}>
      <div className="flex justify-between items-start mb-5">
        <div className="max-w-[80%]">
            <h2 className="text-xl md:text-2xl font-tech font-bold text-slate-800 uppercase tracking-tight truncate leading-tight">{country.name}</h2>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Administration Sectorielle</p>
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors p-1">
            <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        <div>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Statut National</h3>
            <StatRow 
                label="Économie" 
                value={country.stats.economy} 
                icon={DollarSign} 
                colorClass="text-emerald-600"
                isLocked={lockedStats.includes(StatType.ECONOMY)}
                onInc={() => onStatChange(country.name, StatType.ECONOMY, 5)}
                onDec={() => onStatChange(country.name, StatType.ECONOMY, -5)}
            />
            <StatRow 
                label="Militaire" 
                value={country.stats.military} 
                icon={Shield} 
                colorClass="text-rose-600"
                isLocked={lockedStats.includes(StatType.MILITARY)}
                onInc={() => onStatChange(country.name, StatType.MILITARY, 5)}
                onDec={() => onStatChange(country.name, StatType.MILITARY, -5)}
            />
            <StatRow 
                label="Population" 
                value={country.stats.population} 
                icon={Users} 
                colorClass="text-blue-600"
                isLocked={lockedStats.includes(StatType.POPULATION)}
                onInc={() => onStatChange(country.name, StatType.POPULATION, 5)}
                onDec={() => onStatChange(country.name, StatType.POPULATION, -5)}
            />
        </div>

        <div>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Capacités Critiques</h3>
            <div className="space-y-3">
            <CapabilityToggle 
                label="Programme Spatial"
                active={country.stats.hasSpaceProgram}
                icon={Rocket}
                colorClass="text-indigo-600"
                disabled={!canModifySpace}
                onToggle={() => onToggleCapability(country.name, 'hasSpaceProgram')}
            />
            <CapabilityToggle 
                label="Arsenal Nucléaire"
                active={country.stats.hasNuclear}
                icon={Radiation}
                colorClass="text-orange-600"
                disabled={!canModifyNuclear}
                onToggle={() => onToggleCapability(country.name, 'hasNuclear')}
            />
            </div>
             {!country.stats.hasSpaceProgram && !country.stats.hasNuclear && (
                 <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 text-blue-700 text-[10px] rounded-lg border border-blue-100">
                    <AlertCircle size={12} />
                    <span>Développez le spatial pour débloquer le nucléaire.</span>
                 </div>
             )}
             {hasModifiedCapability && (
                 <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-yellow-50 text-yellow-700 text-[10px] rounded-lg border border-yellow-100">
                    <Lock size={12} />
                    <span>Capacité déjà modifiée pour ce tour.</span>
                 </div>
             )}
        </div>
        
        <div className="pt-2">
           <button 
             onClick={() => onOpenCommand(country.name)}
             className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-tech font-bold uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-xs"
           >
             <Swords size={16} />
             ACTIONS DIRECTES
           </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2">Rapport d'Intelligence</h3>
            <p className="leading-relaxed text-[10px] font-medium italic opacity-80">
                {country.stats.military > 80 && country.stats.hasNuclear && " ⚠️ Superpuissance militaire nucléaire détectée."}
                {country.stats.economy < 20 && " ⚠️ Risque d'effondrement économique systémique."}
                {country.stats.hasSpaceProgram && country.stats.economy > 60 && " 🚀 Capacité de projection orbitale confirmée."}
                {!country.stats.military && "Aucune donnée significative."}
            </p>
        </div>
      </div>
    </div>
  );
};

export default CountryPanel;