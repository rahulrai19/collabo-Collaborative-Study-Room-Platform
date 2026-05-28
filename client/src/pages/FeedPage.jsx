import { useState, useEffect, useRef } from 'react';
import { Globe, Heart, MessageSquare, Send, Image as ImageIcon, X, File as FileIcon, Trash2 } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/feed');
      setPosts(data);
    } catch (err) {
      toast.error('Failed to load feed');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !selectedFile) return;
    setLoading(true);
    
    try {
      let data;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('content', newPost);
        formData.append('media', selectedFile);
        const res = await api.post('/feed', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        data = res.data;
      } else {
        const res = await api.post('/feed', { content: newPost });
        data = res.data;
      }

      setPosts([data, ...posts]);
      setNewPost('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Posted to StudyFeed!');
    } catch (err) {
      toast.error('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id) => {
    try {
      const { data } = await api.post(`/feed/${id}/like`);
      setPosts(posts.map(p => p._id === id ? { ...p, likes: data.likes } : p));
    } catch (err) {
      toast.error('Failed to like post');
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/feed/${id}`);
      setPosts(posts.filter(p => p._id !== id));
      toast.success('Post deleted successfully');
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
          <Globe size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">StudyFeed</h1>
          <p className="text-slate-500">See what everyone is studying and sharing.</p>
        </div>
      </div>

      {/* Create Post */}
      <div className="card !p-4">
        <form onSubmit={handlePost} className="flex gap-4">
          <Avatar src={user?.avatar} alt={user?.username} fallback={user?.username} className="w-12 h-12" />
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your study progress or ask a question..."
              className="w-full bg-transparent border-none resize-none outline-none text-slate-800 dark:text-white placeholder-slate-400 mt-2 min-h-[60px]"
            />
            
            {/* File Preview */}
            {selectedFile && (
              <div className="relative inline-flex items-center gap-2 bg-slate-100 dark:bg-dark-800 rounded-lg p-2 mb-3 mt-2 border border-slate-200 dark:border-slate-700">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                ) : (
                  <div className="h-16 w-16 bg-slate-200 dark:bg-dark-700 flex items-center justify-center rounded-md">
                    <FileIcon size={24} className="text-slate-500" />
                  </div>
                )}
                <div className="flex flex-col flex-1 pr-8">
                  <span className="text-xs font-semibold truncate max-w-[150px]">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-1 right-1 p-1 bg-white dark:bg-dark-900 rounded-full text-slate-500 hover:text-red-500 shadow-sm transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => setSelectedFile(e.target.files?.[0])}
                  className="hidden" 
                  accept="image/*,application/pdf,.doc,.docx"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-full transition-colors"
                  title="Attach File or Image"
                >
                  <ImageIcon size={18} />
                </button>
              </div>
              <button 
                type="submit" 
                disabled={(!newPost.trim() && !selectedFile) || loading}
                className="btn-primary py-1.5 px-6 rounded-full flex items-center gap-2 text-sm"
              >
                <Send size={14} />
                Post
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Feed Stream */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No posts yet. Be the first to share something!
          </div>
        ) : (
          posts.map(post => {
            const currentUserId = user?._id || user?.id;
            const isOwner = post.author?._id === currentUserId;
            const hasLiked = post.likes.includes(currentUserId);
            return (
              <div key={post._id} className="card !p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar src={post.author.avatar} alt={post.author.username} fallback={post.author.username} className="w-10 h-10" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{post.author.username}</h3>
                      <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors rounded-full"
                      title="Delete Post"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>

                {/* Render Media */}
                {post.mediaUrl && (
                  <div className="mt-3">
                    {post.mediaType === 'image' ? (
                      <img src={post.mediaUrl} alt="Post attachment" className="max-h-96 w-auto rounded-xl object-contain border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 p-3 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors">
                        <div className="p-2 bg-white dark:bg-dark-900 rounded-lg shadow-sm"><FileIcon size={20} className="text-blue-500" /></div>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">View attached file</span>
                      </a>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${hasLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                  >
                    <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
                    <span>{post.likes.length}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-500 transition-colors">
                    <MessageSquare size={18} />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  );
};

export default FeedPage;
