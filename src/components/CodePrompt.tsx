import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, KeyRound, CornerDownLeft, AlertCircle, Bookmark, ShieldCheck } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface CodePromptProps {
  onCodeValid: (cardData: any) => void;
  onAdminOpen: () => void;
}

export default function CodePrompt({ onCodeValid, onAdminOpen }: CodePromptProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminEntry, setShowAdminEntry] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const formattedCode = code.trim().toUpperCase();

      // Secret developer shortcut to activate Admin Studio directly
      if (formattedCode === 'ADMIN' || formattedCode === 'ADMIN123') {
        onAdminOpen();
        setIsLoading(false);
        return;
      }

      const cardsRef = collection(db, 'cards');
      const q = query(cardsRef, where('code', '==', formattedCode));
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Incorrect access code. Please try again!");
      }

      let card: any = null;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.isDeleted) {
          card = { id: docSnap.id, ...data };
        }
      });

      if (!card) {
        throw new Error("Incorrect access code. Please try again!");
      }

      onCodeValid(card);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminVerify = (e: FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    // Standard Admin password
    if (adminPass === 'admin123') {
      onAdminOpen();
    } else {
      setAdminError("Invalid Admin credentials! Hint: Use 'admin123'");
    }
  };

  return (
    <div 
      id="prompt-stage" 
      className="relative flex items-center justify-center min-h-screen w-full bg-slate-950 px-4 py-8 overflow-hidden select-none"
    >
      {/* Decorative colored glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-[280px] h-[280px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-15">
        {/* Card Visitor Code Login */}
        <motion.div
          id="card-login-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          {/* Top golden bar decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-purple-500 to-pink-500" />

          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 mb-5 animate-pulse">
              <Lock size={26} />
            </div>

            <h2 className="font-serif text-2xl md:text-3xl font-normal text-white tracking-tight mb-2">
              Enter Your Secret Code
            </h2>
            
            <p className="font-sans text-xs text-slate-400 font-light max-w-xs mb-8">
              I've made a dedicated appreciation layout for every person who wished me. Type your unique code to unlock yours!
            </p>

            <form onSubmit={handleCodeSubmit} className="w-full">
              <div className="relative mb-4">
                <input
                  id="input-secret-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="E.g., WELCOME"
                  disabled={isLoading}
                  autoFocus
                  className="w-full bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 font-mono text-center tracking-widest text-lg px-4 py-3.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-3 rounded-xl text-xs text-left mb-5"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                id="btn-verify-code"
                type="submit"
                disabled={isLoading || !code.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_10px_20px_-10px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all"
              >
                {isLoading ? (
                  <span id="loader" className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Unlock My Card</span>
                    <CornerDownLeft size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Authentic Lock Screen Footnote */}
            <div className="mt-8 flex flex-col items-center gap-2 border-t border-slate-800/60 pt-6 w-full text-center">
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                Authorized Personnel & Guest Access door
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
