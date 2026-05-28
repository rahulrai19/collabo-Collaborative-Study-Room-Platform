import { Lock, Medal } from 'lucide-react';
import { BADGES } from '../../lib/badges';

export default function Milestones({ totalSessions = 0 }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <Medal size={20} className="text-primary-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Milestone Badges</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {BADGES.map((badge) => {
          const isUnlocked = totalSessions >= badge.required;
          const Icon = badge.icon;
          const progress = Math.min(100, (totalSessions / badge.required) * 100);

          return (
            <div 
              key={badge.id}
              className={`relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                isUnlocked 
                  ? `bg-slate-50 dark:bg-dark-800 ${badge.border} hover:-translate-y-1 hover:shadow-xl hover:shadow-${badge.color.split('-')[1]}-500/10` 
                  : 'bg-slate-50/50 dark:bg-dark-900/40 border-slate-200 dark:border-slate-700/30 grayscale opacity-60'
              }`}
            >
              {/* Background Glow (Unlocked only) */}
              {isUnlocked && (
                <div className={`absolute inset-0 ${badge.bg} opacity-20 blur-xl`} />
              )}

              {/* Icon Container */}
              <div className={`relative w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner ${isUnlocked ? badge.bg : 'bg-slate-200 dark:bg-slate-800'}`}>
                {isUnlocked ? (
                  <Icon size={28} className={badge.color} />
                ) : (
                  <Lock size={24} className="text-slate-400 dark:text-slate-500" />
                )}
              </div>

              {/* Title & Req */}
              <h3 className={`text-sm font-black mb-1 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {badge.name}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {badge.required} Sessions
              </p>

              {/* Progress Bar (Locked only, or we can show for all) */}
              {!isUnlocked ? (
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 dark:bg-slate-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              ) : (
                <div className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                  ✓ Unlocked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
