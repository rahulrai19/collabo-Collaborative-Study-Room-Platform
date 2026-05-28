import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Play, Pause, Square, UserPlus, Users, ArrowLeft, Lock, Globe, Trash2, Home, Image as ImageIcon, Music, RotateCcw, MessageSquare, Target, Coffee, Moon, X, Maximize, Copy, FileText, Upload, Pin, Download, Timer, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import Avatar from '../components/ui/Avatar';

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", // Beach Sunset
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop", // Mountains Night
  "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop", // Forest
  "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?q=80&w=2560&auto=format&fit=crop", // Cozy Room
  "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop", // Abstract Gradient
];

const TIMER_MODES = {
  focus: { label: 'Focus', minutes: 25, icon: Target, type: 'countdown' },
  shortBreak: { label: 'Short Break', minutes: 5, icon: Coffee, type: 'countdown' },
  longBreak: { label: 'Long Break', minutes: 15, icon: Moon, type: 'countdown' },
  stopwatch: { label: 'Stopwatch', minutes: 0, icon: Timer, type: 'countup' },
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return { m, s };
};

const formatChatTime = (date) =>
  new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export default function RoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Background and UI State
  const [bgIndex, setBgIndex] = useState(0);
  const [activePanel, setActivePanel] = useState('chat'); // 'chat', 'members', null
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');

  // Local Timer State
  const [timerMode, setTimerMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.focus.minutes * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const [returnTimeLeft, setReturnTimeLeft] = useState(15);

  const chatRef = useRef(null);
  const timerRef = useRef(null);
  const returnTimerRef = useRef(null);
  const ignoreDistractionRef = useRef(false);
  const socket = getSocket();

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Fetch room
  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/${id}`);
      setRoom(res.data);
      setMessages(res.data.messages || []);
      setFiles(res.data.sharedFiles || []);
    } catch (err) {
      toast.error('Room not found or access denied');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  // Join socket room
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', id);

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('user_joined', ({ username, onlineUsers }) => {
      setOnlineUsers(onlineUsers);
      if (username !== user.username) toast(`${username} joined`, { icon: '👋', duration: 2000 });
    });
    socket.on('user_left', ({ username, onlineUsers }) => {
      setOnlineUsers(onlineUsers);
    });
    socket.on('presence_update', ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers);
    });
    socket.on('receive_file', (file) => {
      setFiles(prev => [...prev, file]);
      toast.success(`${file.username} shared a file: ${file.fileName}`);
    });
    socket.on('file_pin_update', ({ fileId, isPinned }) => {
      setFiles(prev => prev.map(f => f._id === fileId ? { ...f, isPinned } : f));
    });

    return () => {
      socket.emit('leave_room', id);
      socket.off('receive_message');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('presence_update');
      socket.off('receive_file');
      socket.off('file_pin_update');
    };
  }, [id, socket, user.username]);

  // Pomodoro Timer Logic
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (TIMER_MODES[timerMode].type === 'countup') {
            return prev + 1;
          }
          if (prev <= 1) {
            setTimerActive(false);
            // Auto-switch modes when reaching 0
            if (timerMode === 'focus') {
              toast('Focus session complete! Time for a break.', { icon: '🎯' });
              // Log the session to the backend to update Activity Dashboard
              api.post('/sessions/log', { roomId: id, duration: TIMER_MODES.focus.minutes * 60 })
                .catch(err => console.error('Failed to log session:', err));
              
              switchMode('shortBreak');
            } else {
              toast('Break is over! Ready to focus?', { icon: '☕' });
              switchMode('focus');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timerMode, id]);

  // Deep Focus Mode Logic
  useEffect(() => {
    const handleDistraction = () => {
      if (isDeepFocus && !ignoreDistractionRef.current) {
        setTimerActive(false); // pause timer immediately
        setTabSwitches((prev) => {
          const newCount = prev + 1;
          setShowFocusWarning(true);
          return newCount;
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleDistraction();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) handleDistraction();
    };

    const handleWindowFocus = () => {
      if (ignoreDistractionRef.current) {
        if (isDeepFocus && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log(err));
        }
        setTimeout(() => {
          ignoreDistractionRef.current = false;
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isDeepFocus]);

  // Deep focus return countdown logic
  useEffect(() => {
    if (showFocusWarning && tabSwitches < 3) {
      setReturnTimeLeft(15);
      returnTimerRef.current = setInterval(() => {
        setReturnTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(returnTimerRef.current);
            setTabSwitches(3); // force break
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (returnTimerRef.current) clearInterval(returnTimerRef.current);
    }
    return () => {
      if (returnTimerRef.current) clearInterval(returnTimerRef.current);
    };
  }, [showFocusWarning, tabSwitches]);

  const toggleDeepFocus = () => {
    const newState = !isDeepFocus;
    setIsDeepFocus(newState);
    if (newState && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    }
  };

  // Broadcast timer state
  useEffect(() => {
    if (!socket) return;
    const { m, s } = formatTime(timeLeft);
    const status = timerActive ? 'focusing' : (timeLeft === TIMER_MODES[timerMode].minutes * 60 ? 'idle' : 'paused');
    socket.emit('timer_update', {
      roomId: id,
      status,
      mode: timerMode,
      timeString: `${m}:${s}`,
      distractions: tabSwitches
    });
  }, [timerActive, timerMode, timeLeft, socket, id, tabSwitches]);

  const switchMode = (mode) => {
    if (timerMode === 'stopwatch' && timeLeft > 0) {
      api.post('/sessions/log', { roomId: id, duration: timeLeft }).catch(console.error);
      const { m, s } = formatTime(timeLeft);
      toast.success(`Logged ${m}m ${s}s of study time!`);
    }
    setTimerMode(mode);
    setTimeLeft(TIMER_MODES[mode].minutes * 60);
    setTimerActive(false);
  };

  const resetTimer = () => {
    if (timerMode === 'stopwatch' && timeLeft > 0) {
      api.post('/sessions/log', { roomId: id, duration: timeLeft }).catch(console.error);
      const { m, s } = formatTime(timeLeft);
      toast.success(`Logged ${m}m ${s}s of study time!`);
    }
    setTimeLeft(TIMER_MODES[timerMode].minutes * 60);
    setTimerActive(false);
    setTabSwitches(0);
  };

  const toggleTimer = () => {
    if (!timerActive && timeLeft === 0) resetTimer();
    if (!timerActive) {
      setTabSwitches(0);
    }
    setTimerActive(!timerActive);
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, activePanel]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !socket) return;
    socket.emit('send_message', { roomId: id, text: messageText });
    setMessageText('');
  };

  const triggerFileInput = () => {
    ignoreDistractionRef.current = true;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File must be less than 10MB');
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/rooms/${id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      socket.emit('file_uploaded', { roomId: id, file: res.data });
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePin = async (fileId) => {
    try {
      const res = await api.put(`/rooms/${id}/files/${fileId}/pin`);
      socket.emit('file_pinned', { roomId: id, fileId, isPinned: res.data.isPinned });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pin file');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    try {
      await api.post(`/rooms/${id}/invite`, { username: inviteUsername });
      toast.success(`${inviteUsername} has been invited!`);
      setInviteUsername('');
      setShowInvite(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite user');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Room deleted permanently');
      navigate('/rooms');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const cycleBackground = () => {
    setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!room) return null;
  const userId = user?.id || user?._id;
  const isOwner = room.owner?._id === userId || room.owner === userId;
  const { m, s } = formatTime(timeLeft);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-dark-900 transition-all duration-1000 bg-cover bg-center font-sans"
      style={{ backgroundImage: `url(${BACKGROUNDS[bgIndex]})` }}
    >
      {/* Dim Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-all duration-1000" />
      
      {/* Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        
        {/* Top Header */}
        <div className="p-6 flex justify-between items-start pointer-events-auto">
          {/* Room Info Badge */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
            {room.isPrivate ? <Lock size={16} className="text-white/70" /> : <Globe size={16} className="text-white/70" />}
            <div>
              <h1 className="text-white font-bold text-sm tracking-wide">{room.name}</h1>
              <p className="text-white/60 text-xs">{room.topic}</p>
            </div>
            {room.mode && room.mode !== 'General' && (
              <span className="ml-2 px-2 py-0.5 bg-white/10 rounded-full text-[10px] uppercase font-bold text-white/80 tracking-wider">
                {room.mode}
              </span>
            )}
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-3">
            <button onClick={toggleFullscreen} className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all shadow-lg group" title="Fullscreen">
              <Maximize size={18} className="group-hover:scale-110 transition-transform" />
            </button>
            <button onClick={() => navigate('/rooms')} className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all shadow-lg group" title="Exit Room">
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Central Timer Area */}
        <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto mt-[-4rem]">
          
          {/* Top Toggle */}
          <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-xl rounded-full mb-8 border border-white/10 shadow-2xl">
            {Object.entries(TIMER_MODES).map(([key, data]) => {
              const Icon = data.icon;
              return (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all ${
                    timerMode === key 
                      ? 'bg-white/10 text-white shadow-inner' 
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} className={timerMode === key ? 'text-orange-400' : ''} /> 
                  <div className="flex flex-col items-start">
                    <span>{data.label}</span>
                    <span className="text-[10px] opacity-70">
                      {data.type === 'countup' ? 'Count up' : `${data.minutes} min`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Timer Card */}
          <div className="bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 rounded-[40px] p-12 w-full max-w-2xl text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <div className="text-orange-500 font-bold uppercase tracking-[0.3em] mb-2 text-sm drop-shadow-md">
              {TIMER_MODES[timerMode].label}
            </div>
            
            <div className="text-[11rem] leading-[0.8] font-bold text-white tracking-tighter flex items-center justify-center gap-2 font-mono">
              <span>{m}</span>
              <span className="text-orange-600/80 pb-6">:</span>
              <span className="text-white/90">{s}</span>
            </div>

            {/* Pagination dots indicator */}
            <div className="flex justify-center gap-3 mt-12 mb-2 items-center opacity-40">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full border border-white"></div>
              <span className="text-xs text-white font-mono ml-2">0/4</span>
            </div>
          </div>

          {/* Controls Below Card */}
          <div className="flex items-center gap-6 mt-8">
            <button onClick={resetTimer} className="px-6 py-3 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full backdrop-blur-xl border border-white/10 font-bold text-sm flex items-center gap-2 transition-all">
              <RotateCcw size={16} /> Reset
            </button>
            <button 
              onClick={toggleTimer} 
              className={`px-10 py-3 rounded-full font-extrabold text-sm tracking-wider flex items-center gap-2 transition-all uppercase shadow-2xl ${
                timerActive 
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20' 
                  : 'bg-white text-black hover:bg-gray-100 shadow-white/20'
              }`}
            >
              {timerActive ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
            </button>
            <button 
              onClick={toggleDeepFocus}
              className={`px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all border ${
                isDeepFocus 
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-black/40 text-white/50 border-white/10 hover:text-white/80'
              }`}
              title="Deep Focus Mode: Warns on tab switch, breaks after 3 times"
            >
              <Target size={16} /> Deep Focus
            </button>
          </div>
        </div>

        {/* Left Side: Environment Toggles & Studying Now */}
        <div className="absolute left-6 bottom-6 pointer-events-auto flex items-end gap-4">
          
          {/* Small Toggles */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-lg">
            <button onClick={cycleBackground} className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Change Background">
              <ImageIcon size={18} />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <Music size={18} />
            </button>
          </div>

          {/* Studying Now Panel */}
          <div className="w-64 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg hidden md:block">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Globe size={14} className="text-white/60" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Studying Now</h3>
              <span className="ml-auto bg-primary-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                {onlineUsers.length}
              </span>
            </div>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {onlineUsers.map((u) => {
                const userInRoom = room.members?.find(m => m.username === u.username);
                return (
                <div key={u.username} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
                  <Avatar user={{ username: u.username, avatar: userInRoom?.avatar }} size="sm" />
                  <div className="flex flex-col overflow-hidden min-w-0">
                    <span className="text-sm font-medium text-white/90 truncate">
                      {u.username} {u.username === user.username && <span className="text-[10px] text-white/40">(you)</span>}
                    </span>
                    <span className="text-[10px] text-white/50 truncate uppercase tracking-wider font-bold flex items-center">
                      {u.mode === 'focus' ? 'Focus' : 'Break'} <span className="text-white/30 px-1">•</span> {u.timeString || '25:00'}
                      {u.distractions > 0 && (
                        <span 
                          className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-500 border border-red-500/50 rounded text-[11px] font-black tracking-normal shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                          title={`${u.distractions} Distraction Strikes`}
                        >
                          <AlertTriangle size={12} className="fill-red-500/20" /> {u.distractions}
                        </span>
                      )}
                    </span>
                  </div>
                  <div 
                    className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${
                      u.status === 'focusing' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 
                      u.status === 'paused' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 
                      'bg-slate-500 opacity-50'
                    }`} 
                    title={u.status} 
                  />
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Bottom Toggles */}
        <div className="absolute right-6 bottom-6 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-lg">
            <button 
              onClick={() => setActivePanel(activePanel === 'members' ? null : 'members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activePanel === 'members' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users size={16} /> Members
              <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {room.members?.length} {room.userLimit > 0 ? `/ ${room.userLimit}` : ''}
              </span>
            </button>
            <button 
              onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activePanel === 'chat' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare size={16} /> Chat
              {messages.length > 0 && <span className="w-2 h-2 rounded-full bg-green-400" />}
            </button>
            <button 
              onClick={() => setActivePanel(activePanel === 'files' ? null : 'files')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activePanel === 'files' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText size={16} /> Files
            </button>
            {isOwner && (
              <>
                <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Invite Code">
                  <UserPlus size={16} />
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white/70 hover:text-red-400 hover:bg-red-500/20 transition-colors" title="Delete Room">
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Floating Slide-out Panel (Chat or Members) */}
        {activePanel && (
          <div className="absolute right-6 bottom-24 w-80 h-[500px] max-h-[60vh] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-300">
            
            {activePanel === 'chat' && (
              <>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2"><MessageSquare size={16}/> Room Chat</h3>
                  <button onClick={() => setActivePanel(null)} className="text-white/50 hover:text-white"><X size={16}/></button>
                </div>
                
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                      <MessageSquare size={32} className="text-white mb-2" />
                      <p className="text-white text-sm">No messages yet.</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.username === user.username;
                      const msgUser = room.members?.find(m => m.username === msg.username) || { username: msg.username, avatar: null };
                      return (
                        <div key={i} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <Avatar user={msgUser} size="sm" />
                          <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className={`px-4 py-2 rounded-2xl text-sm ${
                              isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="text-[10px] text-white/40 mt-1 px-1 font-medium tracking-wide">
                              {!isMe && <span>{msg.username} · </span>}
                              {formatChatTime(msg.sentAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={sendMessage} className="p-3 border-t border-white/10 flex gap-2 bg-black/20">
                  <input
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="Message room..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                  />
                  <button type="submit" className={`p-2.5 rounded-xl transition-all ${messageText.trim() ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-white/5 text-white/30'}`} disabled={!messageText.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}

            {activePanel === 'members' && (
              <>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2"><Users size={16}/> Room Members</h3>
                  <button onClick={() => setActivePanel(null)} className="text-white/50 hover:text-white"><X size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {room.members?.map(m => (
                    <div key={m._id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <Avatar user={m} size="sm" />
                      <span className="text-sm font-medium text-white/90 truncate">{m.username}</span>
                      {m._id === room.owner?._id && <span className="ml-auto bg-primary-600/20 text-primary-300 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary-500/30">Owner</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activePanel === 'files' && (
              <>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2"><FileText size={16}/> Shared Files</h3>
                  <button onClick={() => setActivePanel(null)} className="text-white/50 hover:text-white"><X size={16}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                      <FileText size={32} className="text-white mb-2" />
                      <p className="text-white text-sm">No files shared yet.</p>
                    </div>
                  ) : (
                    [...files].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((f, i) => (
                      <div key={f._id || i} className={`p-3 rounded-xl border flex flex-col gap-2 ${f.isPinned ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate" title={f.fileName}>{f.fileName}</p>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">{f.username} • {new Date(f.uploadedAt).toLocaleDateString()}</p>
                          </div>
                          {f.isPinned && <Pin size={14} className="text-amber-400 fill-amber-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <a href={f.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-colors">
                            <Download size={14} /> Download
                          </a>
                          {isOwner && (
                            <button onClick={() => togglePin(f._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
                              <Pin size={14} /> {f.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-white/10 bg-black/20">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <button 
                    onClick={triggerFileInput}
                    disabled={uploadingFile}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {uploadingFile ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={16} />}
                    {uploadingFile ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative bg-dark-800 border border-slate-700/50 w-full max-w-sm rounded-2xl p-6 z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-white mb-2 text-center">Room Invite Code</h2>
            <p className="text-sm text-slate-400 text-center mb-6">Share this code with friends so they can join.</p>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  className="w-full bg-dark-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-center text-3xl font-mono tracking-[0.2em] uppercase focus:outline-none" 
                  value={room.inviteCode || 'N/A'}
                  readOnly 
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" className="flex-1 py-3 px-4 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-bold transition-colors" onClick={() => setShowInvite(false)}>Close</button>
                <button 
                  type="button" 
                  className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(room.inviteCode);
                    toast.success('Invite code copied!');
                    setShowInvite(false);
                  }}
                >
                  <Copy size={18} /> Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Deep Focus Warning Modal */}
      {showFocusWarning && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md" />
          <div className="relative bg-dark-900 border border-red-500/50 w-full max-w-md rounded-3xl p-8 z-10 shadow-[0_0_100px_rgba(239,68,68,0.5)] animate-in zoom-in-95 duration-300 text-center flex flex-col items-center">
            
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
              <Target size={40} className="text-red-500" />
            </div>

            {tabSwitches >= 3 ? (
              <>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wider text-red-500">Focus Broken</h2>
                <p className="text-slate-300 mb-8">You switched tabs too many times. Your Deep Focus session has been broken.</p>
                <button 
                  onClick={() => {
                    setShowFocusWarning(false);
                    resetTimer();
                  }}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors uppercase tracking-widest text-sm shadow-lg shadow-red-600/30"
                >
                  Acknowledge & Reset
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black text-white mb-2">Distraction Detected!</h2>
                <p className="text-slate-300 mb-6">
                  You switched away from the Study Room. Stay focused!
                </p>
                
                <div className="flex gap-2 mb-8">
                  {[1, 2, 3].map((strike) => (
                    <div key={strike} className={`w-12 h-3 rounded-full ${strike <= tabSwitches ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-white/10'}`} />
                  ))}
                </div>

                <div className="text-sm font-bold text-red-400 mb-8 tracking-widest uppercase flex flex-col items-center gap-1">
                  <span>Strike {tabSwitches} of 3</span>
                  <span className="text-3xl text-white font-mono mt-2">{returnTimeLeft}s</span>
                  <span className="text-[10px] text-white/50 tracking-wider">to return before focus breaks</span>
                </div>

                <button 
                  onClick={() => {
                    setShowFocusWarning(false);
                    setTimerActive(true); // Resume timer
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(err => console.log(err));
                    }
                  }}
                  className="w-full py-4 bg-white hover:bg-slate-100 text-black rounded-xl font-black transition-colors uppercase tracking-widest text-sm shadow-xl"
                >
                  Resume Focus
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
