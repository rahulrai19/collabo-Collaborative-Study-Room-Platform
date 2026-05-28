import { useState, useEffect } from 'react';
import { Search, UserPlus, Check, Clock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';

const FindPeoplePage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());
  
  // We should also fetch the current user's friends/requests to show correct status
  const [friendData, setFriendData] = useState({ friends: [], pending: [], sent: [] });

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const { data } = await api.get('/social/friends');
        setFriendData({
          friends: data.friends.map(f => f._id),
          pending: data.pendingRequests.map(f => f._id),
          sent: data.sentRequests.map(f => f._id),
        });
      } catch (err) {
        console.error('Failed to load friend data');
      }
    };
    fetchFriends();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/social/search?q=${query}`);
      setResults(data);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post(`/social/request/${userId}`);
      toast.success('Friend request sent!');
      setSentRequests(prev => new Set(prev).add(userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const formatStudyTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    return hrs > 0 ? `${hrs}h` : `${Math.floor(seconds / 60)}m`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3">
            <Search size={32} />
            Find People
          </h1>
          <p className="text-blue-100 max-w-xl text-lg">Search for classmates, study buddies, or connect with new people to boost your productivity together.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-12 h-14 text-lg"
            />
          </div>
          <button type="submit" className="btn-primary h-14 px-8" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(user => {
            const isFriend = friendData.friends.includes(user._id);
            const isSent = friendData.sent.includes(user._id) || sentRequests.has(user._id);
            const isPending = friendData.pending.includes(user._id);

            return (
              <div key={user._id} className="card flex items-center gap-4">
                <Avatar src={user.avatar} alt={user.username} fallback={user.username} className="w-16 h-16 text-xl" />
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{user.username}</h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Clock size={14} />
                    <span>{formatStudyTime(user.totalStudyTime)} studied</span>
                  </div>
                </div>
                
                {isFriend ? (
                  <button className="p-2 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed" title="Already friends">
                    <Check size={20} />
                  </button>
                ) : isSent ? (
                  <button className="p-2 rounded-xl bg-primary-50 text-primary-500 cursor-not-allowed" title="Request sent">
                    <Check size={20} />
                  </button>
                ) : isPending ? (
                  <button className="text-xs px-3 py-2 bg-slate-100 text-slate-600 rounded-lg whitespace-nowrap cursor-not-allowed">
                    Has requested you
                  </button>
                ) : (
                  <button 
                    onClick={() => sendRequest(user._id)}
                    className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    title="Add friend"
                  >
                    <UserPlus size={20} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {results.length === 0 && query && !loading && (
        <div className="text-center py-12 text-slate-500">
          No users found matching "{query}".
        </div>
      )}
    </div>
  );
};

export default FindPeoplePage;
