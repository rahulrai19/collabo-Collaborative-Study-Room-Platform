import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Users, Trophy, LogOut, Menu, X, Sun, Moon, MessageCircle, Search, Globe, ChevronDown, Database, BookOpen } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import TimerWidget from './TimerWidget';
import Avatar from '../ui/Avatar';
import { getHighestBadge } from '../../lib/badges';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: Users, label: 'Study Rooms' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

const socialItems = [
  { to: '/friends', icon: MessageCircle, label: 'Friends & Chat', color: 'text-emerald-500' },
  { to: '/find', icon: Search, label: 'Find People', color: 'text-blue-500' },
  { to: '/rooms', icon: Users, label: 'Study Rooms', color: 'text-amber-500' },
  { to: '/feed', icon: Globe, label: 'StudyFeed', color: 'text-indigo-500' },
];

const poolItems = [
  { to: '/pool/notes', icon: BookOpen, label: 'Notes Pool', color: 'text-violet-500' },
];

export default function Layout({ children }) {
  const { user, logout, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      api.get('/social/friends')
        .then(res => setPendingCount(res.data.pendingRequests.length))
        .catch(() => {});

      api.get('/sessions/my')
        .then(res => setTotalSessions(res.data.length))
        .catch(() => {});

      const socket = getSocket();
      if (socket) {
        const onRequest = () => {
          setPendingCount(prev => prev + 1);
        };
        socket.on('friend_request_received', onRequest);
        return () => socket.off('friend_request_received', onRequest);
      }
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ avatar: res.data.avatar });
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const TopNavbar = () => {
    const highestBadge = getHighestBadge(totalSessions);
    
    return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-dark-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 transition-colors duration-500 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="https://res.cloudinary.com/dpf8nu189/image/upload/v1779940546/collabo_assets/collabo_logo.png" alt="Collabo Logo" className="w-10 h-10 object-contain mix-blend-multiply dark:invert transition-all" />
            <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">Collabo</span>
          </Link>

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
                      ? 'bg-primary-500/10 text-primary-500 dark:bg-primary-500/20 dark:text-primary-300 border border-primary-500/20 shadow-inner'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-dark-800'
                  }`}
                >
                  <Icon size={16} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {label}
                </Link>
              );
            })}
            
            {/* Connect Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-dark-800">
                <div className="relative">
                  <Globe size={16} />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                Connect
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 transform origin-top group-hover:translate-y-0 translate-y-2">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">Social</div>
                {socialItems.map(({ to, icon: Icon, label, color }) => (
                  <Link key={label} to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors group/item">
                    <div className={`relative p-1.5 rounded-lg bg-slate-100 dark:bg-dark-800 group-hover/item:bg-white dark:group-hover/item:bg-dark-700 shadow-sm transition-colors ${color}`}>
                      <Icon size={16} />
                      {label === 'Friends & Chat' && pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-100 dark:border-dark-800 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Pool Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-dark-800">
                <Database size={16} />
                Pool
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 transform origin-top group-hover:translate-y-0 translate-y-2">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">Resources</div>
                {poolItems.map(({ to, icon: Icon, label, color }) => (
                  <Link key={label} to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors group/item">
                    <div className={`relative p-1.5 rounded-lg bg-slate-100 dark:bg-dark-800 group-hover/item:bg-white dark:group-hover/item:bg-dark-700 shadow-sm transition-colors ${color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Right section (Theme + User) */}
          <div className="hidden md:flex items-center gap-4">
            <TimerWidget />
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-300 transition-colors shadow-inner">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex items-center gap-3 relative group">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              
              <div className="flex items-center gap-2 cursor-pointer pb-2 -mb-2">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="relative rounded-full overflow-hidden shrink-0 group/avatar"
                  title="Change Avatar"
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin shrink-0 flex items-center justify-center bg-slate-100 dark:bg-dark-800" />
                  ) : (
                    <>
                      <Avatar user={user} size="md" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[10px] text-white font-bold tracking-wider">EDIT</span>
                      </div>
                    </>
                  )}
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                    {user?.username}
                    {highestBadge && (
                      <span className={`inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded ${highestBadge.bg} ${highestBadge.color} border ${highestBadge.border} text-[10px] uppercase font-black tracking-widest`} title={`${highestBadge.name} Badge`}>
                        <highestBadge.icon size={10} />
                      </span>
                    )}
                    <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform ml-1" />
                  </span>
                </div>
              </div>
              
              {/* Profile Dropdown */}
              <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 transform origin-top group-hover:translate-y-0 translate-y-2">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.username}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                
                <div className="px-3 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">Social</div>
                {socialItems.map(({ to, icon: Icon, label, color }) => (
                  <Link key={'prof-'+label} to={to} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors group/item">
                    <div className={`relative ${color}`}>
                      <Icon size={16} />
                      {label === 'Friends & Chat' && pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                  </Link>
                ))}
                
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors font-semibold text-sm"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
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
                    ? 'bg-primary-500/10 text-primary-500 dark:bg-primary-500/20 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}

            <div className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Social</div>
            {socialItems.map(({ to, icon: Icon, label, color }) => (
              <Link
                key={'mob-'+label}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800"
              >
                <div className="relative">
                  <Icon size={18} className={color} />
                  {label === 'Friends & Chat' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-dark-900 rounded-full" />
                  )}
                </div>
                {label}
              </Link>
            ))}

            <div className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Resources</div>
            {poolItems.map(({ to, icon: Icon, label, color }) => (
              <Link
                key={'mob-'+label}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800"
              >
                <div className="relative">
                  <Icon size={18} className={color} />
                </div>
                {label}
              </Link>
            ))}

            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <button onClick={() => { setMobileOpen(false); fileInputRef.current?.click(); }} className="relative shrink-0">
                  <Avatar user={user} size="md" />
                </button>
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
  };

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
      <main className={`flex-1 w-full flex flex-col ${isRoomDetailPage ? '' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 z-10'}`}>
        <div className={isRoomDetailPage ? 'h-full w-full' : 'animate-in fade-in slide-in-from-bottom-4 duration-700 flex-1'}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {!isRoomDetailPage && (
        <footer className="w-full py-6 mt-auto border-t border-slate-200 dark:border-slate-800/50 bg-white/50 dark:bg-dark-900/50 backdrop-blur-sm z-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
              &copy; {new Date().getFullYear()} Rahul Rai. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
