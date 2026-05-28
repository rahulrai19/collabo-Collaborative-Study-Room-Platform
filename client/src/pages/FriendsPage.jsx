import { useState, useEffect, useRef } from 'react';
import { MessageCircle, UserX, Check, X, Send } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

const FriendsPage = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const chatRef = useRef(null);

  const fetchFriends = async () => {
    try {
      const { data } = await api.get('/social/friends');
      setFriends(data.friends);
      setPending(data.pendingRequests);
    } catch (err) {
      toast.error('Failed to load friends');
    }
  };

  useEffect(() => {
    fetchFriends();
    
    const globalSocket = getSocket();
    if (globalSocket) {
      setSocket(globalSocket);

      const onPrivateMsg = (msg) => {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => {
          if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 100);
      };

      const onRequest = () => {
        fetchFriends(); // Refresh to get the new request
      };

      globalSocket.on('receive_private_message', onPrivateMsg);
      globalSocket.on('friend_request_received', onRequest);

      return () => {
        globalSocket.off('receive_private_message', onPrivateMsg);
        globalSocket.off('friend_request_received', onRequest);
      };
    }
  }, []);

  useEffect(() => {
    if (activeFriend) {
      const fetchHistory = async () => {
        try {
          const { data } = await api.get(`/chat/history/${activeFriend._id}`);
          setMessages(data);
          setTimeout(() => {
            if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }, 100);
        } catch (err) {
          toast.error('Failed to load chat');
        }
      };
      fetchHistory();
    }
  }, [activeFriend]);

  const handleAccept = async (id) => {
    try {
      await api.post(`/social/accept/${id}`);
      toast.success('Friend added!');
      fetchFriends();
    } catch (err) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/social/reject/${id}`);
      fetchFriends();
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };

  const handleRemove = async () => {
    if (!activeFriend) return;
    if (!window.confirm(`Are you sure you want to remove ${activeFriend.username} from your friends list?`)) return;
    
    try {
      await api.post(`/social/remove/${activeFriend._id}`);
      toast.success('Friend removed');
      setActiveFriend(null);
      fetchFriends();
    } catch (err) {
      toast.error('Failed to remove friend');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeFriend || !socket) return;
    
    socket.emit('private_message', {
      recipientId: activeFriend._id,
      text: newMessage
    });
    setNewMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
      
      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        {/* Pending Requests */}
        {pending.length > 0 && (
          <div className="card !p-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Pending Requests ({pending.length})</h3>
            <div className="space-y-3">
              {pending.map(req => (
                <div key={req._id} className="flex items-center gap-3">
                  <Avatar src={req.avatar} alt={req.username} fallback={req.username} className="w-10 h-10" />
                  <span className="flex-1 font-medium truncate">{req.username}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleAccept(req._id)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Check size={16} /></button>
                    <button onClick={() => handleReject(req._id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friend List */}
        <div className="card flex-1 flex flex-col !p-4 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Friends ({friends.length})</h3>
          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {friends.length === 0 ? (
              <p className="text-slate-400 text-sm italic text-center py-4">No friends yet. Head to Find People!</p>
            ) : (
              friends.map(friend => (
                <button
                  key={friend._id}
                  onClick={() => setActiveFriend(friend)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${activeFriend?._id === friend._id ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-slate-50 dark:hover:bg-dark-700'}`}
                >
                  <Avatar src={friend.avatar} alt={friend.username} fallback={friend.username} className="w-10 h-10" />
                  <span className="font-medium truncate flex-1 text-left">{friend.username}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 card flex flex-col !p-0 overflow-hidden">
        {activeFriend ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-dark-800/50">
              <div className="flex items-center gap-3">
                <Avatar src={activeFriend.avatar} alt={activeFriend.username} fallback={activeFriend.username} className="w-12 h-12" />
                <div>
                  <h2 className="font-bold text-lg">{activeFriend.username}</h2>
                  <p className="text-xs text-slate-500">Studied {Math.floor(activeFriend.totalStudyTime / 3600)}h {(Math.floor(activeFriend.totalStudyTime / 60) % 60)}m</p>
                </div>
              </div>
              
              <button 
                onClick={handleRemove}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors border border-transparent hover:border-red-600"
                title="Remove Friend"
              >
                <UserX size={16} />
                Remove
              </button>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <MessageCircle size={48} className="opacity-20" />
                  <p>No messages yet. Say hi!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender === user._id;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-dark-700 rounded-bl-sm'}`}>
                        <p>{msg.content}</p>
                        <span className={`text-[10px] block mt-1 ${isMe ? 'text-primary-200' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-dark-800/50">
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input pr-12 rounded-full"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <MessageCircle size={64} className="opacity-20 mb-4" />
            <p className="text-lg">Select a friend to start chatting</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default FriendsPage;
