import { Star, Compass, Target, BookOpen, GraduationCap, Zap, Flame, Diamond, Crown, Trophy } from 'lucide-react';

export const BADGES = [
  { id: 'newbie', name: 'Newbie', required: 1, icon: Star, color: 'text-sky-400', bg: 'bg-sky-400/20', border: 'border-sky-400/30' },
  { id: 'beginner', name: 'Beginner', required: 5, icon: Compass, color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30' },
  { id: 'novice', name: 'Novice', required: 10, icon: Target, color: 'text-teal-400', bg: 'bg-teal-400/20', border: 'border-teal-400/30' },
  { id: 'apprentice', name: 'Apprentice', required: 25, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30' },
  { id: 'scholar', name: 'Scholar', required: 50, icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-400/20', border: 'border-indigo-400/30' },
  { id: 'adept', name: 'Adept', required: 100, icon: Zap, color: 'text-violet-400', bg: 'bg-violet-400/20', border: 'border-violet-400/30' },
  { id: 'expert', name: 'Expert', required: 250, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30' },
  { id: 'master', name: 'Master', required: 500, icon: Diamond, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/20', border: 'border-fuchsia-400/30' },
  { id: 'grandmaster', name: 'Grandmaster', required: 1000, icon: Crown, color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30' },
  { id: 'legend', name: 'Legend', required: 2000, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30' },
];

export const getHighestBadge = (totalSessions) => {
  let highest = null;
  for (const badge of BADGES) {
    if (totalSessions >= badge.required) {
      highest = badge;
    } else {
      break;
    }
  }
  return highest;
};
