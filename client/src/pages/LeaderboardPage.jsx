import { useEffect, useState } from 'react';
import { Trophy, Clock, Medal } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const rankColors = ['text-amber-500 dark:text-yellow-400', 'text-slate-400 dark:text-slate-300', 'text-orange-500 dark:text-orange-400'];
const rankBg = ['bg-amber-500/10 dark:bg-yellow-900/30', 'bg-slate-500/10 dark:bg-slate-700/30', 'bg-orange-500/10 dark:bg-orange-900/30'];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/leaderboard').then(r => setLeaders(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy size={24} className="text-amber-500 dark:text-yellow-400" /> Leaderboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Top studiers ranked by total study time</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((u, i) => (
            <div
              key={u._id}
              className={`card flex items-center gap-4 ${
                u.username === user?.username ? 'border-primary-600/50' : ''
              }`}
            >
              {/* Rank */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                i < 3 ? rankBg[i] : 'bg-slate-100 dark:bg-dark-700'
              } ${i < 3 ? rankColors[i] : 'text-slate-500 dark:text-slate-400'}`}>
                {i < 3 ? <Medal size={20} /> : i + 1}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {u.username?.[0]?.toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                  {u.username}
                  {u.username === user?.username && (
                    <span className="badge bg-primary-500/10 dark:bg-primary-900/60 text-primary-600 dark:text-primary-300 text-xs">You</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">Rank #{i + 1}</p>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1.5 text-sm">
                <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                <span className={i < 3 ? rankColors[i] : 'text-slate-600 dark:text-slate-300'}>
                  {formatTime(u.totalStudyTime)}
                </span>
              </div>
            </div>
          ))}

          {leaders.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Trophy size={48} className="mx-auto mb-3 text-slate-300 dark:text-dark-600" />
              <p>No study data yet. Start a session to appear here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
