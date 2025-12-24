import React, { useState } from 'react';
import { X, Mail, ShieldCheck, Globe, Loader2, Lock, AlertCircle, Settings } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';

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
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  if (!isOpen) return null;

  // Si auth est undefined, c'est que la config Firebase a échoué dans services/firebase.ts
  if (!auth) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-red-200">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-red-50 text-red-600 rounded-full">
                        <Settings size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Configuration Manquante</h2>
                    <p className="text-sm text-slate-600">
                        L'application ne parvient pas à se connecter aux services d'authentification. 
                        Cela est généralement dû à des clés API manquantes dans l'environnement.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg w-full text-left text-xs font-mono text-slate-500 overflow-x-auto">
                        <p className="font-bold text-slate-700 mb-2">Vérifiez vos variables Vercel :</p>
                        <p>VITE_FIREBASE_API_KEY</p>
                        <p>VITE_FIREBASE_AUTH_DOMAIN</p>
                        <p>VITE_FIREBASE_PROJECT_ID</p>
                    </div>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    try {
      if (isRegisterMode) {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        if (userCredential.user) {
           await userCredential.user.updateProfile({ displayName: email.split('@')[0] });
        }
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }

      const user = auth.currentUser;
      if (user) {
        onLogin({ 
            name: user.displayName || user.email?.split('@')[0] || 'Commandant', 
            email: user.email || '' 
        });
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Une erreur est survenue.";
      if (err.code === 'auth/invalid-credential') msg = "Email ou mot de passe incorrect.";
      if (err.code === 'auth/email-already-in-use') msg = "Cet email est déjà utilisé.";
      if (err.code === 'auth/weak-password') msg = "Le mot de passe est trop faible (6 min).";
      if (err.code === 'auth/invalid-api-key') msg = "Clé API Firebase invalide.";
      setError(msg);
      setIsLoggingIn(false); 
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      // In v8, googleProvider is passed directly
      // But we exported initialized provider from firebase.ts
      await auth.signInWithPopup(googleProvider);
      const user = auth.currentUser;
      if (user) {
        onLogin({ 
            name: user.displayName || 'Commandant', 
            email: user.email || '' 
        });
      }
    } catch (err: any) {
      console.error(err);
      let msg = "La connexion Google a échoué.";
      if (err.code === 'auth/popup-closed-by-user') msg = "Connexion annulée par l'utilisateur.";
      if (err.code === 'auth/invalid-api-key') msg = "Clé API Firebase invalide.";
      setError(msg);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-slate-50 p-8 text-center relative border-b border-slate-100">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
          <div className="inline-flex p-4 rounded-3xl bg-white shadow-sm text-blue-600 mb-4 border border-slate-100">
            <Globe size={40} className="animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-tech font-bold text-slate-900 uppercase tracking-tighter">Accès Terminal</h2>
          <div className="flex justify-center gap-4 mt-4">
            <button 
              onClick={() => { setIsRegisterMode(false); setError(null); }}
              className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${!isRegisterMode ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
            >
              Connexion
            </button>
            <button 
              onClick={() => { setIsRegisterMode(true); setError(null); }}
              className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${isRegisterMode ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
            >
              Créer Compte
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Email officiel"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800 text-sm"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800 text-sm"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoggingIn && !error ? <Loader2 className="animate-spin" size={18} /> : null}
              {isRegisterMode ? "Initialiser Protocole" : "Authentification"}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-slate-300 text-[9px] font-black uppercase tracking-widest">OU VIA GOOGLE</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full py-3.5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center transition-all active:scale-[0.98] shadow-sm text-sm disabled:opacity-50"
          >
             <GoogleLogo />
             Compte Google
          </button>

          <div className="pt-2 flex flex-col items-center gap-2">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> Firebase Auth Secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}