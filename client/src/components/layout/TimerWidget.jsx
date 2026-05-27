import { useState, useEffect, useRef } from 'react';
import { Timer, Target, Clock, StopCircle, Play, Pause, RotateCcw, ChevronLeft, X } from 'lucide-react';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function TimerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'pomodoro', 'countdown', 'stopwatch'
  const dropdownRef = useRef(null);

  // Pomodoro State
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState('focus'); // 'focus' or 'break'

  // Countdown State
  const [cdTime, setCdTime] = useState(15 * 60);
  const [cdActive, setCdActive] = useState(false);
  const [cdInput, setCdInput] = useState(15);

  // Stopwatch State
  const [swTime, setSwTime] = useState(0);
  const [swActive, setSwActive] = useState(false);

  // Global Interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (pomoActive) {
        setPomoTime((t) => {
          if (t <= 1) {
            const nextMode = pomoMode === 'focus' ? 'break' : 'focus';
            setPomoMode(nextMode);
            return nextMode === 'focus' ? 25 * 60 : 5 * 60;
          }
          return t - 1;
        });
      }
      if (cdActive) {
        setCdTime((t) => {
          if (t <= 1) {
            setCdActive(false);
            return 0;
          }
          return t - 1;
        });
      }
      if (swActive) {
        setSwTime((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pomoActive, pomoMode, cdActive, swActive]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Check if any timer is running to show a badge
  const isAnyActive = pomoActive || cdActive || swActive;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-300 shadow-sm ${
          isOpen
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-slate-300'
        }`}
        title="Timers & Tools"
      >
        <Timer size={18} />
        {isAnyActive && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-dark-900 shadow-sm" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
          
          {/* MENU VIEW */}
          {!activeTool && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 pt-2 pb-3 mb-1 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Productivity Tools</span>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={16} />
                </button>
              </div>

              <button onClick={() => setActiveTool('pomodoro')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-700/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Target size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Pomodoro</p>
                    <p className="text-xs text-slate-500">25m focus / 5m break</p>
                  </div>
                </div>
                {pomoActive && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
              </button>

              <button onClick={() => setActiveTool('countdown')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-700/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Clock size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Clock Timer</p>
                    <p className="text-xs text-slate-500">Custom countdown</p>
                  </div>
                </div>
                {cdActive && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
              </button>

              <button onClick={() => setActiveTool('stopwatch')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-700/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                    <StopCircle size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Counter</p>
                    <p className="text-xs text-slate-500">Stopwatch</p>
                  </div>
                </div>
                {swActive && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
              </button>
            </div>
          )}

          {/* POMODORO VIEW */}
          {activeTool === 'pomodoro' && (
            <div className="p-4">
              <button onClick={() => setActiveTool(null)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-4">
                <ChevronLeft size={14} /> Back
              </button>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Target size={14} /> {pomoMode === 'focus' ? 'Focus Time' : 'Break Time'}
                </div>
                <div className="text-6xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter">
                  {formatTime(pomoTime)}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPomoActive(!pomoActive)} className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-white transition-colors ${pomoActive ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}>
                  {pomoActive ? <><Pause size={18}/> Pause</> : <><Play size={18}/> Start</>}
                </button>
                <button onClick={() => { setPomoActive(false); setPomoTime(25 * 60); setPomoMode('focus'); }} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-slate-600 dark:text-slate-300 transition-colors">
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          )}

          {/* COUNTDOWN VIEW */}
          {activeTool === 'countdown' && (
            <div className="p-4">
              <button onClick={() => setActiveTool(null)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-4">
                <ChevronLeft size={14} /> Back
              </button>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Clock size={14} /> Clock Timer
                </div>
                
                {!cdActive && cdTime === cdInput * 60 ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <input 
                      type="number" 
                      min="1" 
                      max="120"
                      value={cdInput} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCdInput(val);
                        setCdTime(val * 60);
                      }}
                      className="w-20 text-center text-4xl font-mono font-bold bg-slate-100 dark:bg-dark-700 border-none rounded-xl py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xl font-bold text-slate-500">min</span>
                  </div>
                ) : (
                  <div className="text-6xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter mt-2">
                    {formatTime(cdTime)}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCdActive(!cdActive)} disabled={cdTime <= 0} className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-white transition-colors ${cdTime <= 0 ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : cdActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                  {cdActive ? <><Pause size={18}/> Pause</> : <><Play size={18}/> Start</>}
                </button>
                <button onClick={() => { setCdActive(false); setCdTime(cdInput * 60); }} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-slate-600 dark:text-slate-300 transition-colors">
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STOPWATCH VIEW */}
          {activeTool === 'stopwatch' && (
            <div className="p-4">
              <button onClick={() => setActiveTool(null)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-4">
                <ChevronLeft size={14} /> Back
              </button>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  <StopCircle size={14} /> Counter
                </div>
                <div className="text-6xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter mt-2">
                  {formatTime(swTime)}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSwActive(!swActive)} className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-white transition-colors ${swActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                  {swActive ? <><Pause size={18}/> Pause</> : <><Play size={18}/> Start</>}
                </button>
                <button onClick={() => { setSwActive(false); setSwTime(0); }} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-slate-600 dark:text-slate-300 transition-colors">
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
