import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { LogIn, TrendingUp, Clock } from 'lucide-react';

export default function Login() {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user has profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const role = user.email === 'jkemboi744@gmail.com' ? 'admin' : 'staff';
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: user.displayName,
          role: role,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#cbd5e1] font-sans relative overflow-hidden flex flex-col">
      {/* Background Ambience - Recreating the "blob" aesthetic */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[70%] bg-emerald-900/10 blur-[140px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[140px] rounded-full" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* Header */}
      <header className="h-24 flex items-center justify-between px-8 md:px-16 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#00a36c] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,163,108,0.3)]">
            <div className="h-4 w-4 bg-white rotate-45 rounded-[1px]" />
          </div>
          <span className="font-serif italic text-3xl text-white tracking-tight">PayPulse</span>
        </div>
        
        <div className="hidden md:flex items-center gap-12">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-[#00ffa3]/80">
            <div className="h-2 w-2 rounded-full bg-[#00ffa3] shadow-[0_0_8px_#00ffa3]" />
            NETWORK PRIMARY: ONLINE
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
            SYSTEM NODE: 0X8841-ALPHA
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-[#0a0a0a] rounded-[3rem] p-12 md:p-20 shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.03] relative"
        >
          {/* Internal Glow */}
          <div className="absolute inset-0 bg-emerald-500/[0.01] rounded-[3rem] pointer-events-none" />
          
          <div className="mb-16">
            <h1 className="font-serif italic font-bold text-6xl text-white mb-6 tracking-tight">Terminal Login</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.35em] mb-12 flex items-center gap-4">
              AUTHENTICATION REQUIRED
              <span className="h-px w-20 bg-white/5" />
            </p>
            
            <div className="space-y-6">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.15em] leading-[1.8] max-w-sm">
                ACCESS IS RESTRICTED TO AUTHORIZED PERSONNEL. YOUR IP ADDRESS AND BIOMETRIC MARKERS MAY BE LOGGED IN ACCORDANCE WITH SYSTEM PROTOCOL.
              </p>
              <div className="h-0.5 w-16 bg-emerald-500/20" />
            </div>
          </div>

          <div className="space-y-10">
            <button
              onClick={handleGoogleLogin}
              className="w-full h-16 bg-[#00a36c] hover:bg-[#00c582] text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] transition-all duration-500 shadow-[0_20px_40px_rgba(0,163,108,0.15)] group relative overflow-hidden flex items-center justify-center gap-4"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 brightness-[10] relative z-10" />
              <span className="relative z-10">Verify Identity</span>
            </button>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-800" />)}
              </div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">SSL_SECURE_GATEWAY_V2</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="h-20 flex items-center justify-between px-8 md:px-16 relative z-10 opacity-30 group hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
          © 2026 PAYPULSE CRYPTO-CORE
        </p>
        <div className="flex items-center gap-8">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] hover:text-emerald-500 cursor-pointer transition-colors">END-TO-END ENCRYPTED</span>
        </div>
      </footer>
    </div>
  );
}
