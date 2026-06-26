import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, BarChart2, Brain, Trophy,
  Menu, X, ChevronRight, LogOut, Settings, User
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/objetivos', icon: Target, label: 'Objetivos' },
  { path: '/estadisticas', icon: BarChart2, label: 'Estadísticas' },
  { path: '/pnl', icon: Brain, label: 'Técnicas PNL' },
  { path: '/logros', icon: Trophy, label: 'Logros' },
];

function NavLink({ path, icon: Icon, label, mobile, onClick }: {
  path: string; icon: typeof LayoutDashboard; label: string; mobile?: boolean; onClick?: () => void;
}) {
  const { pathname } = useLocation();
  const active = pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
        mobile ? 'text-base' : 'text-sm',
        active
          ? 'bg-indigo-50 text-indigo-700 font-semibold'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon size={mobile ? 20 : 18} className={cn(active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600')} />
      <span>{label}</span>
      {active && mobile && <ChevronRight size={16} className="ml-auto text-indigo-400" />}
    </Link>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-dvh flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 bottom-0 z-30">
        <div className="p-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Target size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Plan de Acción</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.path} {...item} />
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Link
            to="/ajustes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-all"
          >
            <Settings size={18} className="text-gray-400" />
            <span>Ajustes</span>
          </Link>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors" title="Salir">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Target size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Plan de Acción</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-xl"
            >
              <div className="p-5 flex items-center justify-between border-b border-gray-100">
                <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Target size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Plan de Acción</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink key={item.path} {...item} mobile onClick={() => setMobileOpen(false)} />
                ))}
              </nav>
              <div className="p-3 border-t border-gray-100">
                <NavLink path="/ajustes" icon={Settings} label="Ajustes" mobile onClick={() => setMobileOpen(false)} />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-red-600 hover:bg-red-50 transition-all w-full mt-1"
                >
                  <LogOut size={20} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-dvh">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
