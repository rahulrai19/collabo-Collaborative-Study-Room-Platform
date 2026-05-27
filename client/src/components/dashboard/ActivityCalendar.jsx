import { useMemo } from 'react';
import { Calendar } from 'lucide-react';

// Generates an array of last N days ending today
const getLastNDays = (n) => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
};

// Formats date to YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ActivityCalendar({ sessions = [] }) {
  // Number of weeks to show (20 weeks = ~5 months)
  const WEEKS = 26;
  const TOTAL_DAYS = WEEKS * 7;
  
  const days = useMemo(() => getLastNDays(TOTAL_DAYS), []);

  const activityMap = useMemo(() => {
    const map = {};
    sessions.forEach(session => {
      if (!session.startTime) return;
      const dateStr = formatDate(new Date(session.startTime));
      if (!map[dateStr]) map[dateStr] = 0;
      map[dateStr] += (session.duration || 0); // accumulate seconds
    });
    return map;
  }, [sessions]);

  // Max duration logic for intensity scaling (e.g. max expected is 4 hours = 14400s)
  const MAX_EXPECTED_SECONDS = 4 * 60 * 60; 

  const getColorClass = (seconds) => {
    if (!seconds) return 'bg-slate-100 dark:bg-dark-700/50';
    const ratio = seconds / MAX_EXPECTED_SECONDS;
    if (ratio < 0.25) return 'bg-primary-300 dark:bg-primary-800/60';
    if (ratio < 0.5) return 'bg-primary-400 dark:bg-primary-600/80';
    if (ratio < 0.75) return 'bg-primary-500 dark:bg-primary-500';
    return 'bg-primary-600 dark:bg-primary-400';
  };

  // Group days by week (columns)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Formatting hours/mins for tooltip
  const formatTooltip = (seconds) => {
    if (!seconds) return 'No study time';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m studied`;
    return `${m}m studied`;
  };

  return (
    <div className="card w-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar size={18} className="text-primary-500 dark:text-primary-400" />
          Activity Calendar
        </h2>
      </div>
      
      <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 -mx-2 px-2">
        <div className="flex gap-2 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-[7px] text-[10px] text-slate-400 dark:text-slate-500 font-medium justify-between py-[2px] pr-2">
            <span className="leading-none">Sun</span>
            <span className="leading-none"></span>
            <span className="leading-none">Tue</span>
            <span className="leading-none"></span>
            <span className="leading-none">Thu</span>
            <span className="leading-none"></span>
            <span className="leading-none">Sat</span>
          </div>
          
          {/* Heatmap columns */}
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-[6px]">
              {week.map((day, dIndex) => {
                const dateStr = formatDate(day);
                const seconds = activityMap[dateStr] || 0;
                return (
                  <div 
                    key={dIndex} 
                    title={`${formatTooltip(seconds)} on ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    className={`w-[14px] h-[14px] rounded-[3px] border border-slate-200/60 dark:border-slate-700/50 transition-all duration-300 hover:ring-2 hover:ring-offset-1 hover:ring-primary-400 dark:hover:ring-offset-dark-800 cursor-pointer ${getColorClass(seconds)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>Less</span>
        <div className="w-3.5 h-3.5 rounded-[3px] border border-slate-200/60 dark:border-slate-700/50 bg-slate-100 dark:bg-dark-700/50" />
        <div className="w-3.5 h-3.5 rounded-[3px] border border-slate-200/60 dark:border-slate-700/50 bg-primary-300 dark:bg-primary-800/60" />
        <div className="w-3.5 h-3.5 rounded-[3px] border border-slate-200/60 dark:border-slate-700/50 bg-primary-400 dark:bg-primary-600/80" />
        <div className="w-3.5 h-3.5 rounded-[3px] border border-slate-200/60 dark:border-slate-700/50 bg-primary-500 dark:bg-primary-500" />
        <div className="w-3.5 h-3.5 rounded-[3px] border border-slate-200/60 dark:border-slate-700/50 bg-primary-600 dark:bg-primary-400" />
        <span>More</span>
      </div>
    </div>
  );
}
