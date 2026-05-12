import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Send, TrendingUp, Users, ArrowUpRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { initiateStkPush } from '../lib/api';

interface DashboardProps {
  user: any;
  role: string | null;
}

export default function Dashboard({ user, role }: DashboardProps) {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('0795396214');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, count: 0, pending: 0 });

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentTransactions(txs);
      
      // Basic stats calculation (should be optimized with cloud functions in real apps)
      let total = 0;
      let pending = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'completed') total += data.amount;
        if (data.status === 'pending') pending++;
      });
      setStats({ total, count: snapshot.size, pending });
    });

    return () => unsubscribe();
  }, []);

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Format phone number to 254...
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    try {
      // 1. Create pending transaction in Firestore
      const docRef = await addDoc(collection(db, 'transactions'), {
        amount: parseFloat(amount),
        phoneNumber: formattedPhone,
        description: description || 'Payment collection',
        status: 'pending',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Trigger STK Push via backend
      await initiateStkPush({
        phoneNumber: formattedPhone,
        amount: parseFloat(amount),
        transactionId: docRef.id,
        description: description,
      });

      setMessage({ type: 'success', text: 'Payment prompt sent successfully!' });
      setAmount('');
      setPhone('');
      setDescription('');
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.details?.errorMessage || 'Failed to send payment prompt' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif italic text-slate-100 tracking-tight">Payment Hub</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1">Operational Control Center</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            API Connected
          </div>
          <button className="px-5 py-2.5 bg-white text-black text-[10px] font-bold rounded uppercase tracking-widest hover:bg-slate-200 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
            VIEW ANALYTICS
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: `KES ${stats.total.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Network Trans', value: stats.count.toString(), icon: Send, color: 'text-white' },
          { label: 'Active Queue', value: stats.pending.toString(), icon: Clock, color: 'text-amber-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-dark-surface p-7 rounded-2xl border border-white/5 shadow-2xl flex flex-col"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
            <div className="flex items-end justify-between">
               <h3 className={`text-3xl font-serif italic ${stat.color}`}>{stat.value}</h3>
               <stat.icon size={20} className="text-slate-700" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Collection Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 lg:col-span-5 bg-dark-accent border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">New Payment Request</h3>
          </div>

          <form onSubmit={handleSendPayment} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Customer Mobile</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
                className="w-full bg-dark-input border border-white/5 focus:border-emerald-500/50 p-4 rounded-xl transition-all outline-none text-white font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Amount (KES)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">KES</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-dark-input border border-white/5 focus:border-emerald-500/50 p-4 pl-12 rounded-xl transition-all outline-none text-white font-bold text-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Transaction Ref</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Purchase details / Invoice #"
                className="w-full bg-dark-input border border-white/5 focus:border-emerald-500/50 p-4 rounded-xl transition-all outline-none text-white text-sm resize-none"
              />
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 px-6 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Initiate STK Push</span>
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 lg:col-span-7 flex flex-col bg-dark-accent border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Live Transaction Feed</h3>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-800" />)}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-600 border-b border-white/5">
                  <th className="px-8 py-5 font-bold tracking-widest">Reference</th>
                  <th className="px-8 py-5 font-bold tracking-widest">Customer</th>
                  <th className="px-8 py-5 font-bold tracking-widest">Amount</th>
                  <th className="px-8 py-5 font-bold tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {recentTransactions.map((tx, i) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6 font-mono text-slate-500 group-hover:text-slate-300">KP-{tx.id.slice(-5).toUpperCase()}</td>
                    <td className="px-8 py-6">
                      <div className="text-white font-semibold">{tx.phoneNumber}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">M-Pesa Express</div>
                    </td>
                    <td className="px-8 py-6 text-white font-bold font-serif text-lg italic">KES {tx.amount}</td>
                    <td className="px-8 py-6">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        tx.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-600 italic">
                      SYSTEM STANDBY - NO DATA DETECTED
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-white/[0.02] flex justify-center">
            <button className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 hover:text-white transition-colors">
              Request Full Audit View
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
