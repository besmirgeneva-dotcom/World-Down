import React from 'react';
import { Alliance, Country } from '../types';
import { Crown, Users, ShieldCheck } from 'lucide-react';

interface AllianceOverlayProps {
  alliances: Alliance[];
  countries: Country[];
  onLeaderChange: (allianceId: string, countryId: string) => void;
}

export default function AllianceOverlay({ alliances, countries, onLeaderChange }: AllianceOverlayProps) {
  return (
    <div className="absolute top-24 left-4 z-40 w-80 flex flex-col gap-3 animate-slideRight">
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-300">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 text-slate-800">
          <ShieldCheck size={20} className="text-indigo-600" />
          <h3 className="font-tech font-bold uppercase tracking-wider text-sm">Gouvernance Mondiale</h3>
        </div>

        <div className="space-y-4">
          {alliances.map(alliance => {
            // Find members of this alliance
            const members = countries.filter(c => c.allianceId === alliance.id && !c.isDestroyed);
            const leader = countries.find(c => c.id === alliance.leaderId);

            return (
              <div key={alliance.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                {/* Alliance Color Strip */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{ backgroundColor: alliance.color }}
                ></div>

                <div className="pl-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800 font-tech uppercase">{alliance.name}</span>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono flex items-center gap-1">
                      <Users size={8} /> {members.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Crown size={14} className="text-yellow-600 shrink-0" />
                    <span className="text-xs text-slate-500 font-bold uppercase mr-1">Présidé par :</span>
                    
                    <select
                      value={alliance.leaderId || ''}
                      onChange={(e) => onLeaderChange(alliance.id, e.target.value)}
                      className="flex-1 bg-white border border-slate-300 text-slate-800 text-xs rounded py-1 px-2 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer hover:bg-slate-100 transition-colors truncate"
                      disabled={members.length === 0}
                    >
                      {!leader && <option value="">-- Aucun --</option>}
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {members.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1 italic pl-6">Alliance dissoute (aucun membre)</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}