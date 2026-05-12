import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Sidebar from './components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';

import { Menu, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          // If profile doesn't exist, check if it's the admin from env/hardcoded
          if (user.email === 'jkemboi744@gmail.com') {
            setRole('admin');
          } else {
            setRole('staff'); // Default
          }
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-dark-bg">
        <motion.div
           animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-dark-bg text-slate-300 font-sans">
        {user && (
          <>
            <div className={`fixed inset-0 bg-black/70 z-30 md:hidden transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)} />
            <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <Sidebar user={user} role={role} onNavClick={() => setMobileMenuOpen(false)} />
            </div>
            
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-dark-surface border-b border-dark-border flex items-center justify-between px-6 z-20">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-emerald-600 rounded flex items-center justify-center">
                  <div className="h-3 w-3 bg-white rounded-sm rotate-45" />
                </div>
                <span className="font-serif italic font-bold text-lg tracking-tight text-white">PayPulse</span>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-400">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </>
        )}
        <main className={`flex-1 ${user ? 'md:ml-64 pt-16 md:pt-0' : ''} bg-dark-bg transition-all duration-300`}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
              <Route path="/" element={user ? <Dashboard user={user} role={role} /> : <Navigate to="/login" />} />
              <Route path="/transactions" element={user ? <Transactions user={user} role={role} /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  );
}
