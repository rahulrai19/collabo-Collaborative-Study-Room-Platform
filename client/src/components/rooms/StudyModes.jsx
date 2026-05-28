import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const modes = [
  {
    title: 'Study With Me',
    capacity: 'Up to 100',
    capacityColor: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    dotColor: 'bg-blue-500',
    subtitle: 'Ambient · Body-Doubling',
    subtitleColor: 'text-blue-600 dark:text-blue-400',
    description: 'Silent body-doubling with beautiful ambient backgrounds. Sit in a lofi café, dark academia library, or cherry blossom garden while you focus.',
    bullets: [
      'Ambient themes: Lofi Café, Dark Academia, Tokyo Night...',
      'Your own Pomodoro timer',
      'Chat unlocks on break only',
      'See others studying without distraction'
    ],
    buttonColor: 'bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-600'
  },
  {
    title: 'Study Group',
    capacity: 'Up to 20',
    capacityColor: 'text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
    dotColor: 'bg-purple-500',
    subtitle: 'Synced Pomodoro · Accountability',
    subtitleColor: 'text-purple-600 dark:text-purple-400',
    description: 'Join a synced Pomodoro sprint, stay accountable with a small group of motivated students. Real focus, real results.',
    bullets: [
      'Synced Pomodoro timer for the whole group',
      'Shared accountability in real time',
      'Chat opens only on break',
      'Up to 20 members per room'
    ],
    buttonColor: 'bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-purple-600 dark:text-purple-400 border-slate-200 dark:border-slate-600'
  },
  {
    title: '24/7 Study Hall',
    capacity: 'Up to 200',
    capacityColor: 'text-teal-500 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
    dotColor: 'bg-teal-500',
    subtitle: 'Open Community · Always On',
    subtitleColor: 'text-teal-600 dark:text-teal-400',
    description: 'The always-on open community. No timer pressure, casual chat always open. Show up anytime and find others studying around the world.',
    bullets: [
      'Always open for 24/7, no schedule',
      'Chat always available',
      'Your own free-focus timer',
      'Up to 200 members per room'
    ],
    buttonColor: 'bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-teal-600 dark:text-teal-400 border-slate-200 dark:border-slate-600'
  },
  {
    title: 'Deep Focus Room',
    capacity: 'Up to 50',
    capacityColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    dotColor: 'bg-rose-500',
    subtitle: 'Strict Anti-Distraction',
    subtitleColor: 'text-rose-600 dark:text-rose-400',
    description: 'Lock in with our strict distraction tracker. Enforced full-screen, tab switching penalties, and performance badges.',
    bullets: [
      'Enforced full-screen mode',
      'Distraction tracking & penalties',
      'Earn ranks from Newbie to Master',
      'Maximum accountability'
    ],
    buttonColor: 'bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-600'
  }
];

export default function StudyModes() {
  const navigate = useNavigate();

  return (
    <div className="w-full py-10 mt-10 border-t border-slate-200 dark:border-slate-800">
      <div className="text-center mb-10">
        <h3 className="text-xs font-bold tracking-widest text-primary-600 dark:text-primary-400 uppercase mb-3">
          Four Ways To Study
        </h3>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Choose how you want to focus
        </h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modes.map((mode, i) => (
          <div key={i} className="card flex flex-col h-full bg-slate-50 dark:bg-dark-800/40 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600/80 transition-all duration-300 group">
            {/* Top Tag & Dot */}
            <div className="flex items-center justify-between mb-6">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${mode.capacityColor}`}>
                {mode.capacity}
              </span>
              <div className={`w-2 h-2 rounded-full ${mode.dotColor} shadow-[0_0_8px_currentColor]`} />
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {mode.title}
            </h3>
            <p className={`text-sm font-semibold mb-4 ${mode.subtitleColor}`}>
              {mode.subtitle}
            </p>

            {/* Description */}
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
              {mode.description}
            </p>

            {/* Bullets */}
            <ul className="space-y-3 mb-8 flex-1">
              {mode.bullets.map((bullet, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${mode.dotColor}`} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <button
              onClick={() => navigate('/rooms')}
              className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-between border transition-all duration-300 ${mode.buttonColor}`}
            >
              Enter room <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
