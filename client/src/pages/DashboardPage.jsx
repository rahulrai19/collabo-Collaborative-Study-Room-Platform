import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, BookOpen, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import StudyModes from '../components/rooms/StudyModes';
import ActivityCalendar from '../components/dashboard/ActivityCalendar';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/sessions/my'),
      api.get('/rooms'),
      api.get('/auth/me'),
    ]).then(([s, r, u]) => {
      setSessions(s.data.slice(0, 5));
      setAllSessions(s.data);
      setRooms(r.data.slice(0, 3));
      updateUser(u.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalSessions = sessions.length;
  const avgDuration = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / sessions.length)
    : 0;

  const stats = [
    { label: 'Total Study Time', value: formatTime(user?.totalStudyTime || 0), icon: Clock, color: 'text-primary-500 dark:text-primary-400', bg: 'bg-primary-500/10 dark:bg-primary-500/20', border: 'border-primary-500/30' },
    { label: 'Sessions Completed', value: totalSessions, icon: TrendingUp, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', border: 'border-emerald-500/30' },
    { label: 'Avg Session', value: formatTime(avgDuration), icon: BookOpen, color: 'text-fuchsia-500 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20', border: 'border-fuchsia-500/30' },
    { label: 'Rooms Joined', value: rooms.length, icon: Users, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20', border: 'border-amber-500/30' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Left: Quote & Timer */}
        <div className="card flex flex-col items-center justify-center text-center space-y-8 h-full relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full -z-10" />
          
          <div className="relative w-44 h-44 rounded-full border-8 border-slate-100 dark:border-dark-700/50 flex flex-col items-center justify-center bg-white/40 dark:bg-dark-800/40 backdrop-blur-md shadow-2xl">
            {/* Clock ticks */}
            {[...Array(12)].map((_, i) => (
              <div key={i} className="absolute w-1 h-3 bg-slate-300 dark:bg-slate-600 rounded-full" style={{ transform: `rotate(${i * 30}deg) translateY(-70px)` }} />
            ))}
            {/* Hour hand */}
            <div className="absolute w-1.5 h-12 bg-slate-700 dark:bg-slate-300 rounded-full origin-bottom bottom-1/2 left-1/2 -translate-x-1/2 shadow-lg transition-transform" style={{ transform: `rotate(${currentTime.getHours() * 30 + currentTime.getMinutes() * 0.5}deg)` }} />
            {/* Minute hand */}
            <div className="absolute w-1 h-16 bg-primary-500 rounded-full origin-bottom bottom-1/2 left-1/2 -translate-x-1/2 shadow-lg transition-transform" style={{ transform: `rotate(${currentTime.getMinutes() * 6}deg)` }} />
            {/* Second hand */}
            <div className="absolute w-0.5 h-20 bg-rose-500 rounded-full origin-bottom bottom-1/2 left-1/2 -translate-x-1/2 shadow-lg transition-transform" style={{ transform: `rotate(${currentTime.getSeconds() * 6}deg)` }} />
            {/* Center dot */}
            <div className="absolute w-3 h-3 bg-white border-2 border-primary-500 rounded-full z-10 shadow-sm" />
            
            {/* Digital Readout */}
            <div className="absolute bottom-6 bg-slate-100/80 dark:bg-dark-900/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
              {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </div>
          </div>

          <p className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-200 leading-snug italic tracking-tight px-4 relative">
            <span className="absolute -top-4 -left-2 text-6xl text-primary-500/20 font-serif">"</span>
            Collaborate in real-time, stay consistent, and achieve your goals together.
            <span className="absolute -bottom-6 -right-2 text-6xl text-primary-500/20 font-serif">"</span>
          </p>
        </div>

        {/* Right: Welcoming and Stats */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-500/10 dark:bg-primary-500/20 blur-3xl rounded-full -z-10" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-600">
                {user?.username}
              </span>
              <Sparkles className="text-amber-400 animate-pulse" size={28} />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Here's your study overview</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`card border-l-4 ${border} hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group p-5`}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent rounded-bl-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3 shadow-inner ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Calendar Heatmap */}
      <ActivityCalendar sessions={allSessions} />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Sessions */}
        <div className="card h-full flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-primary-500 dark:text-primary-400" />
              Recent Sessions
            </h2>
          </div>
          {sessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-dark-700/50 flex items-center justify-center mb-4">
                <Clock size={28} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-center font-medium">No sessions yet.<br/>Join a room to start!</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {sessions.map(s => (
                <div key={s._id} className="group flex items-center justify-between p-4 bg-slate-50/50 dark:bg-dark-900/40 hover:bg-slate-100 dark:hover:bg-dark-700/60 rounded-xl border border-slate-200 dark:border-slate-700/30 transition-all duration-300">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">{s.room?.name || 'Deleted Room'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDate(s.startTime)}</p>
                  </div>
                  <span className="badge bg-primary-500/10 text-primary-600 dark:text-primary-300 border-primary-500/20">{formatTime(s.duration)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

                {/* My Rooms */}
        <div className="card h-full flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-primary-500 dark:text-primary-400" />
              My Rooms
            </h2>
            <Link to="/rooms" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-semibold flex items-center gap-1 group">
              View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {rooms.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-dark-700/50 flex items-center justify-center mb-4">
                <Users size={28} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No rooms yet.</p>
              <Link to="/rooms" className="btn-primary text-sm mt-5 inline-block">Browse Rooms</Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {rooms.map(r => (
                <Link key={r._id} to={`/rooms/${r._id}`}
                  className="group flex items-center justify-between p-4 bg-slate-50/50 dark:bg-dark-900/40 hover:bg-slate-100 dark:hover:bg-dark-700/60 rounded-xl border border-slate-200 dark:border-slate-700/30 hover:border-primary-500/30 transition-all duration-300">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">{r.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{r.topic} · {r.members?.length} members</p>
                  </div>
                  {r.isActive ? (
                    <span className="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      Live
                    </span>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-dark-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={14} className="text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <StudyModes />
    </div>
  );
}
