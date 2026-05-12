import { LogOut, LayoutDashboard, ReceiptText, Users, Settings, TrendingUp } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';

interface SidebarProps {
  user: any;
  role: string | null;
  onNavClick?: () => void;
}

export default function Sidebar({ user, role, onNavClick }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onNavClick) onNavClick();
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Transactions', icon: ReceiptText, path: '/transactions' },
    ...(role === 'admin' ? [{ name: 'Integrations', icon: TrendingUp, path: '/integrations' }] : []),
  ];

  return (
    <aside className="flex flex-col w-64 bg-dark-surface border-r border-dark-border h-screen overflow-y-auto shadow-2xl md:shadow-none">
      <div className="p-8">
        <div className="flex flex-col">
          <span className="font-serif italic text-2xl text-white tracking-tight leading-none">PayPulse</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-2">Secure Admin Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => onNavClick && onNavClick()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-white/5 text-white'
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-transparent border border-slate-700'
                    }`} />
                    <item.icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-sm font-medium tracking-wide">{item.name}</span>
                    {isActive && (
                      <motion.div layoutId="activeDot" className="ml-auto w-1 h-1 bg-emerald-500 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 border-t border-dark-border mt-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded border border-white/10 flex items-center justify-center font-bold text-white text-xs">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.email}</p>
            <p className="text-[10px] text-slate-500 capitalize tracking-wider">{role || 'User'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
