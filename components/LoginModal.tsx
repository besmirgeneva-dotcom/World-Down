import React, { useState } from 'react';
import { X, Mail, ShieldCheck, Globe } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { name: string; email: string }) => void;
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" className="mr-2">
    <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.89 2.69-6.62z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.7H.95v2.33A8.99 8.99 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.95a8.99 8.99 0 0 0 0 8.08l3.01-2.33z"/>
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15.02 2.3A8.93 8.93 0 0 0 9 0 8.99 8.99 0 0 0 .95 4.96l3.01 2.33c.71-2.12 2.7-3.71 5.04-3.71z"/>
  </svg>
);

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) onLogin({ name: email.split('@')[0], email });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-slate-50 p-12 text-center relative border-b border-slate-100">
          <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
          <div className="inline-flex p-5 rounded-3xl bg-white shadow-sm text-blue-600 mb-8 border border-slate-100">
            <Globe size={56} className="animate-spin-slow" />
          </div>
          <h2 className="text-3xl font-tech font-bold text-slate-900 uppercase tracking-tighter">Accès Terminal</h2>
          <p className="text-slate-500 text-sm mt-3 font-medium">Prenez le contrôle de l'Hégémonie</p>
        </div>

        <div className="p-12 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="email" 
                placeholder="votre@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
            >
              Continuer par Email
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-6 text-slate-300 text-[10px] font-black uppercase tracking-widest">OU</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button 
            onClick={() => onLogin({ name: "Commandant", email: "google-auth@world.com" })}
            className="w-full py-4 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center transition-all active:scale-[0.98] shadow-sm"
          >
            <GoogleLogo />
            Se connecter avec Google
          </button>

          <div className="pt-2 flex flex-col items-center gap-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Sécurisé par WorldDown Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}