import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BookOpen, LayoutDashboard, Users, Trophy, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import TimerWidget from './TimerWidget';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: Users, label: 'Study Rooms' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const TopNavbar = () => (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-dark-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 transition-colors duration-500 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl shadow-lg shadow-primary-500/30">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">StudyRoom</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-semibold group ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300 border border-primary-500/20 shadow-inner'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-dark-800'
                  }`}
                >
                  <Icon size={16} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right section (Theme + User) */}
          <div className="hidden md:flex items-center gap-4">
            <TimerWidget />
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-300 transition-colors shadow-inner">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all duration-300"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-3">
            <button onClick={toggleTheme} className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 bg-slate-100 dark:bg-dark-800 rounded-lg">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl absolute w-full shadow-2xl">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
                  location.pathname === to
                    ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.username}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-left text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );

  const isRoomDetailPage = location.pathname.match(/^\/rooms\/[a-zA-Z0-9_-]+$/);

  return (
    <div className="flex flex-col min-h-screen bg-transparent relative overflow-hidden">
      {/* Dark Mode Background Graphics */}
      {isDark && !isRoomDetailPage && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="floating-card-1 absolute top-20 left-10 w-64 h-96 rounded-3xl" />
          <div className="floating-card-2 absolute bottom-10 right-20 w-80 h-80 rounded-full blur-[2px]" />
          <div className="floating-card-3 absolute top-1/2 left-1/3 w-48 h-64 rounded-[40px] opacity-50" />
        </div>
      )}

      {!isRoomDetailPage && <TopNavbar />}

      {/* Main content */}
      <main className={`flex-1 w-full ${isRoomDetailPage ? '' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 z-10'}`}>
        <div className={isRoomDetailPage ? 'h-full w-full' : 'animate-in fade-in slide-in-from-bottom-4 duration-700'}>
          {children}
        </div>
      </main>
    </div>
  );
}
