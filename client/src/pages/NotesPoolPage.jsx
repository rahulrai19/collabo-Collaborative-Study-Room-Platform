import { useState, useEffect, useRef } from 'react';
import { BookOpen, Upload, Download, Search, FileText, Lock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';

export default function NotesPoolPage() {
  const { user, updateUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');
  const [file, setFile] = useState(null);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch (err) {
      toast.error('Failed to load notes pool');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh user to get latest credits
    api.get('/auth/me').then(res => {
      updateUser(res.data);
    }).catch(() => {});
    fetchNotes();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !description || !category || !year || !file) {
      return toast.error('All fields and file are required');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('year', year);
    formData.append('file', file);

    try {
      const res = await api.post('/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Note uploaded! You earned +2 Download Credits.');
      setNotes([res.data, ...notes]);
      setShowModal(false);
      // Refresh user credits
      api.get('/auth/me').then(r => updateUser(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload note');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (noteId) => {
    try {
      const res = await api.post(`/notes/${noteId}/download`);
      if (res.data.creditsLeft !== undefined) {
        updateUser({ ...user, notesDownloadCredits: res.data.creditsLeft });
      }
      
      // Open file in new tab
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const finalUrl = res.data.fileUrl.startsWith('http') 
        ? res.data.fileUrl 
        : baseUrl.replace('/api', '') + res.data.fileUrl;
        
      window.open(finalUrl, '_blank');
      toast.success('Download started!');
      
      // Optimistically update download count
      setNotes(notes.map(n => n._id === noteId ? { ...n, downloads: n.downloads + 1 } : n));
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to download note');
      }
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      toast.success('Note deleted successfully');
      setNotes(notes.filter(n => n._id !== noteId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.category.toLowerCase().includes(search.toLowerCase()) ||
    n.year.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-500 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl font-extrabold flex items-center gap-3 mb-2">
              <BookOpen size={32} />
              Notes Pool
            </h1>
            <p className="text-primary-100 max-w-lg">
              Share your knowledge and access a community pool of study materials. Upload notes to earn download credits!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[120px]">
              <p className="text-primary-200 text-xs font-bold uppercase tracking-wider mb-1">Your Credits</p>
              <p className="text-white font-black text-3xl">{user?.notesDownloadCredits ?? 0}</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-white text-primary-600 hover:bg-primary-50 transition-colors px-6 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl"
            >
              <Upload size={20} />
              Upload Note
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search notes, categories, or years..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 bg-slate-50 dark:bg-dark-900 w-full border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-500/20"
          />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Showing {filteredNotes.length} notes
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-500">
            <BookOpen size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No notes found</h3>
          <p className="text-slate-500 dark:text-slate-400">Be the first to upload a note in this category!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => {
            const currentUserId = user?._id || user?.id;
            const isOwner = note.uploader?._id === currentUserId;
            
            return (
              <div key={note._id} className="card group hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 flex flex-col h-full border-slate-200 dark:border-slate-700/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{note.title}</h3>
                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1 uppercase tracking-wider">
                      {note.category} • {note.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOwner && (
                      <button 
                        onClick={() => handleDelete(note._id)}
                        className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500">
                      <FileText size={20} />
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 line-clamp-3">
                  {note.description}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Avatar user={note.uploader} size="sm" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                        {note.uploader?.username}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-dark-800 px-2 py-1 rounded-md">
                      <Download size={12} /> {note.downloads}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDownload(note._id)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                      isOwner 
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-dark-800 dark:text-slate-300 dark:hover:bg-dark-700'
                        : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    }`}
                  >
                    {isOwner ? (
                      <>My Note (Free)</>
                    ) : (
                      <>
                        <Download size={16} /> 
                        Download (1 Credit)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload size={24} className="text-primary-500" />
                Upload Note
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload a helpful note and earn <strong className="text-primary-500">+2 Download Credits</strong>.
              </p>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="input w-full bg-slate-50 dark:bg-dark-800" placeholder="e.g., Data Structures Midterm Notes" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="input w-full bg-slate-50 dark:bg-dark-800 h-24 resize-none" placeholder="What's included in these notes?"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Category / Subject</label>
                  <input required type="text" value={category} onChange={e => setCategory(e.target.value)} className="input w-full bg-slate-50 dark:bg-dark-800" placeholder="e.g., Computer Science" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Year / Semester</label>
                  <input required type="text" value={year} onChange={e => setYear(e.target.value)} className="input w-full bg-slate-50 dark:bg-dark-800" placeholder="e.g., 2nd Year" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">File</label>
                <input required type="file" onChange={e => setFile(e.target.files?.[0])} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-500/10 dark:file:text-primary-400 dark:hover:file:bg-primary-500/20 cursor-pointer" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary flex-1 bg-primary-500 hover:bg-primary-600 shadow-primary-500/30">
                  {uploading ? 'Uploading...' : 'Upload & Earn Credits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
