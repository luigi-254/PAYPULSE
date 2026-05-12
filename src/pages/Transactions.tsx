import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Search, Filter, Download, ArrowRight, ExternalLink, ReceiptText, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { queryTransactionStatus } from '../lib/api';

interface TransactionsProps {
  user: any;
  role: string | null;
}

export default function Transactions({ user, role }: TransactionsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));

    // Apply role-based filtering if needed (staff only see theirs)
    if (role === 'staff') {
      q = query(collection(db, 'transactions'), where('createdBy', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [user.uid, role]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.phoneNumber.includes(searchTerm) || 
                          tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (tx.mpesaReceiptNumber && tx.mpesaReceiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || tx.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Phone', 'Amount', 'Status', 'M-Pesa Ref', 'Description'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : '',
      tx.phoneNumber,
      tx.amount,
      tx.status,
      tx.mpesaReceiptNumber || '-',
      tx.description || '-'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `paypulse_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif italic text-slate-100 tracking-tight">Audit Archive</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1">Full Transaction Lifecycle History</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 bg-white text-black py-2.5 px-6 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
        >
          <Download size={14} />
          <span>Export Master CSV</span>
        </button>
      </header>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search global identifiers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-surface border border-white/5 p-4 pl-14 rounded-xl outline-none focus:border-emerald-500/30 transition-all text-sm font-medium shadow-2xl"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'completed', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all border ${
                filterStatus === status 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-dark-surface text-slate-500 border-white/5 hover:border-white/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table/List */}
      <div className="bg-dark-accent rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr_0.5fr] gap-4 p-8 border-b border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-[0.25em] bg-white/[0.02]">
          <div>Identity Ref</div>
          <div>Asset Value</div>
          <div>Network Ref</div>
          <div>Status</div>
          <div>Temporal Entry</div>
          <div className="text-right">Action</div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredTransactions.map((tx, i) => (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              key={tx.id}
              className="lg:grid lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr_0.5fr] gap-4 p-8 hover:bg-white/[0.02] transition-colors items-center group"
            >
              <div className="flex items-center gap-4 mb-4 lg:mb-0">
                <div className="h-10 w-10 bg-dark-input rounded border border-white/5 flex items-center justify-center text-slate-500">
                  <ReceiptText size={18} />
                </div>
                <div>
                  <p className="font-bold text-white tracking-wide">{tx.phoneNumber}</p>
                  <p className="text-[10px] text-slate-600 font-bold font-mono tracking-widest">#{tx.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="mb-4 lg:mb-0">
                <p className="font-serif italic font-bold text-lg text-white">KES {tx.amount.toLocaleString()}</p>
                <div className="w-16 h-0.5 bg-emerald-500/20 mt-1" />
              </div>

              <div className="mb-4 lg:mb-0">
                <p className="font-mono font-bold text-xs text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-widest">{tx.mpesaReceiptNumber || 'SYS-PENDING'}</p>
              </div>

              <div className="mb-4 lg:mb-0">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                  tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                  tx.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                  'bg-amber-500/10 text-amber-500'
                }`}>
                  {tx.status}
                </span>
              </div>

              <div className="mb-4 lg:mb-0">
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                  {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : 'TODAY'}
                </p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                  {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'REALTIME'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                {tx.status === 'pending' && (
                  <button 
                    onClick={async () => {
                      try {
                        const status = await queryTransactionStatus(tx.checkoutRequestId);
                        console.log('Queried Status:', status);
                        // The callback usually handles the DB update, but manual query is good for UI feedback
                      } catch (err) {
                        console.error('Manual Query Failed:', err);
                      }
                    }}
                    className="p-3 hover:bg-white/5 rounded-lg transition-colors text-emerald-500 hover:text-emerald-400"
                    title="Query M-Pesa Status"
                  >
                    <RefreshCw size={18} />
                  </button>
                )}
                <button className="p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-600 hover:text-white">
                  <ExternalLink size={18} />
                </button>
              </div>
            </motion.div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="py-32 text-center space-y-6">
              <div className="h-20 w-20 bg-dark-input rounded-full flex items-center justify-center mx-auto text-slate-800 border border-white/5">
                <Search size={32} />
              </div>
              <div className="space-y-1">
                <p className="font-serif italic text-white text-xl">End of Archive</p>
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">No records match current visibility filter</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
