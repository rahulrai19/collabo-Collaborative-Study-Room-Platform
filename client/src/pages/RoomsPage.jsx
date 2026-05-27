import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Lock, Globe, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StudyModes from '../components/rooms/StudyModes';

const TOPICS = ['General', 'Mathematics', 'Science', 'Programming', 'History', 'Language', 'Engineering', 'Medicine', 'Law', 'Other'];

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterMode, setFilterMode] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', topic: 'General', isPrivate: false, mode: 'General' });
  const [creating, setCreating] = useState(false);

  const fetchRooms = () => {
    api.get('/rooms').then(r => setRooms(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Room name required');
    setCreating(true);
    try {
      await api.post('/rooms', form);
      toast.success('Room created!');
      setShowModal(false);
      setForm({ name: '', description: '', topic: 'General', isPrivate: false, mode: 'General' });
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const filtered = rooms.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.topic?.toLowerCase().includes(search.toLowerCase());
    const matchesMode = filterMode ? r.mode === filterMode : true;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative mb-8">
        <div className="absolute top-0 right-10 w-40 h-40 bg-primary-500/10 dark:bg-primary-500/10 blur-3xl rounded-full -z-10" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              Study Rooms
              <Sparkles className="text-primary-500 dark:text-primary-400 animate-pulse" size={28} />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Join an active room or create your own</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 mr-2 md:mr-4 border-r border-slate-200 dark:border-slate-700 pr-4 md:pr-6">
              <button 
                onClick={() => setFilterMode(filterMode === 'Study With Me' ? null : 'Study With Me')}
                className={`text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm border ${filterMode === 'Study With Me' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50' : 'text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border-slate-200 dark:bg-dark-800/80 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 dark:hover:border-blue-500/30'}`}>
                Study With Me
              </button>
              <button 
                onClick={() => setFilterMode(filterMode === 'Study Group' ? null : 'Study Group')}
                className={`text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm border ${filterMode === 'Study Group' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/50' : 'text-slate-600 bg-white hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 border-slate-200 dark:bg-dark-800/80 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-purple-500/10 dark:hover:text-purple-400 dark:hover:border-purple-500/30'}`}>
                Study Group
              </button>
              <button 
                onClick={() => setFilterMode(filterMode === '24/7 Study Hall' ? null : '24/7 Study Hall')}
                className={`text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm border ${filterMode === '24/7 Study Hall' ? 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/50' : 'text-slate-600 bg-white hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 border-slate-200 dark:bg-dark-800/80 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-teal-500/10 dark:hover:text-teal-400 dark:hover:border-teal-500/30'}`}>
                24/7 Study Hall
              </button>
            </div>
            
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center justify-center gap-2 px-6 shadow-primary-500/30 whitespace-nowrap">
              <Plus size={20} /> Create Room
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xl group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            className="input pl-11 py-3 bg-white/60 dark:bg-dark-900/80 text-lg shadow-inner"
            placeholder="Search rooms by name or topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Rooms grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-dark-700/50 rounded-full flex items-center justify-center mb-6">
            <BookOpen size={40} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-lg font-medium">No rooms found.</p>
          <p className="text-slate-500 mt-2">Try a different search or create the first one!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-6">Create New Room</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(room => {
            const isOwner = room.owner?._id === user?.id || room.owner?._id === user?._id;
            const isMember = room.members?.some(m => m._id === user?.id || m._id === user?._id || m === user?.id);
            return (
              <Link key={room._id} to={`/rooms/${room._id}`}
                className="card hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-500/40 transition-all duration-300 group cursor-pointer block relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent rounded-bl-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {room.isPrivate
                      ? <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg"><Lock size={14} /></div>
                      : <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><Globe size={14} /></div>}
                    <span className="badge bg-slate-100 dark:bg-dark-700/80 text-slate-700 dark:text-slate-300 border-slate-300/50 dark:border-slate-600/50">{room.topic}</span>
                    {room.mode && room.mode !== 'General' && (
                      <span className="badge bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">{room.mode}</span>
                    )}
                  </div>
                  {room.isActive && (
                    <span className="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1.5 px-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      Live
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight">{room.name}</h3>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 line-clamp-2 flex-1 font-medium leading-relaxed">
                  {room.description || "No description provided for this room."}
                </p>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/40 group-hover:border-slate-300 dark:group-hover:border-slate-700/80 transition-colors">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-sm bg-slate-50 dark:bg-dark-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/30">
                    <Users size={14} className="text-primary-500 dark:text-primary-400" />
                    <span>{room.members?.length || 0} members</span>
                  </div>
                  <div className="flex gap-2">
                    {isOwner ? (
                      <span className="badge bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Owner</span>
                    ) : isMember ? (
                      <span className="badge bg-primary-500/10 text-primary-600 dark:text-primary-300 border-primary-500/20">Member</span>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-700/50 group-hover:bg-primary-500 group-hover:text-white flex items-center justify-center transition-all">
                        <ArrowRight size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-dark-900/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative card w-full max-w-md z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create Study Room</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Room Name <span className="text-red-500 dark:text-red-400">*</span></label>
                <input className="input" placeholder="e.g. JEE Maths 2026" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea className="input resize-none" rows={3} placeholder="What will you study here?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Topic</label>
                  <select className="input" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Study Mode</label>
                  <select className="input" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
                    <option value="General">General</option>
                    <option value="Study With Me">Study With Me</option>
                    <option value="Study Group">Study Group</option>
                    <option value="24/7 Study Hall">24/7 Study Hall</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-dark-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-400 dark:border-slate-600 accent-primary-500"
                  checked={form.isPrivate} onChange={e => setForm({ ...form, isPrivate: e.target.checked })} />
                <div>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-white">Private room</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Only invited users can join via username</span>
                </div>
              </label>
              <div className="flex gap-4 pt-4 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1 shadow-primary-500/30" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
