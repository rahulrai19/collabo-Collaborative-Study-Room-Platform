import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Play, Pause, Square, UserPlus, Users, ArrowLeft, Lock, Globe, Trash2, Home, Image as ImageIcon, Music, RotateCcw, MessageSquare, Target, Coffee, Moon, X, Maximize } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", // Beach Sunset
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop", // Mountains Night
  "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop", // Forest
  "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?q=80&w=2560&auto=format&fit=crop", // Cozy Room
  "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop", // Abstract Gradient
];

const TIMER_MODES = {
  focus: { label: 'Focus', minutes: 25, icon: Target },
  shortBreak: { label: 'Short Break', minutes: 5, icon: Coffee },
  longBreak: { label: 'Long Break', minutes: 15, icon: Moon },
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
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);

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

  const chatRef = useRef(null);
  const timerRef = useRef(null);
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

    return () => {
      socket.emit('leave_room', id);
      socket.off('receive_message');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('presence_update');
    };
  }, [id, socket, user.username]);

  // Pomodoro Timer Logic
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Auto-switch modes when reaching 0
            if (timerMode === 'focus') {
              toast('Focus session complete! Time for a break.', { icon: '🎯' });
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
  }, [timerActive, timerMode]);

  const switchMode = (mode) => {
    setTimerMode(mode);
    setTimeLeft(TIMER_MODES[mode].minutes * 60);
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimeLeft(TIMER_MODES[timerMode].minutes * 60);
    setTimerActive(false);
  };

  const toggleTimer = () => {
    if (!timerActive && timeLeft === 0) resetTimer();
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

  const cycleBackground = () => {
    setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!room) return null;
  const isOwner = room.owner?._id === user?.id || room.owner === user?.id;
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
                    <span className="text-[10px] opacity-70">{data.minutes} min</span>
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

            {/* Pagination dots indicator (just for UI aesthetic matching screenshot) */}
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
              {onlineUsers.map((u) => (
                <div key={u} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {u[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/90 truncate">{u}</span>
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </div>
              ))}
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
              <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{room.members?.length}</span>
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
            {isOwner && (
              <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <UserPlus size={16} />
              </button>
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
                      return (
                        <div key={i} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg">
                            {msg.username?.[0]?.toUpperCase()}
                          </div>
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
                      <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-inner">
                        {m.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white/90 truncate">{m.username}</span>
                      {m._id === room.owner?._id && <span className="ml-auto bg-primary-600/20 text-primary-300 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary-500/30">Owner</span>}
                    </div>
                  ))}
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
            <h2 className="text-lg font-bold text-white mb-4">Invite User to Room</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <input className="w-full bg-dark-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors" 
                  placeholder="Enter exactly username" value={inviteUsername}
                  onChange={e => setInviteUsername(e.target.value)} required />
              </div>
              <div className="flex gap-3">
                <button type="button" className="flex-1 py-3 px-4 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-bold transition-colors" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary-600/20">
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
