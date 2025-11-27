import { useState, useEffect } from 'react';
import { MessageCircle, Heart, Send, Smile, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import EmojiPicker from 'emoji-picker-react';
import { formatRelativeTime } from '../utils/dateUtils';

export default function Comments({ itemType, itemId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuthStore();

  useEffect(() => {
    loadComments();
  }, [itemType, itemId]);

  const loadComments = async () => {
    try {
      const response = await axios.get(`/api/${itemType}/${itemId}/comments`);
      setComments(response.data.comments || response.data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;

    try {
      await axios.post(`/api/${itemType}/${itemId}/comments`, 
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment');
    }
  };

  const handleLike = async (commentId) => {
    if (!token) return;
    try {
      await axios.post(`/api/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewComment(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment? This will also delete all replies.')) return;
    
    try {
      await axios.delete(`/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={20} className="text-purple-400" />
        <h3 className="text-lg font-bold">Comments ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      {token ? (
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="btn-secondary px-3"
            >
              <Smile size={20} />
            </button>
            <button type="submit" className="btn-primary px-4">
              <Send size={20} />
            </button>
          </div>
          
          {showEmojiPicker && (
            <div className="absolute top-12 right-0 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                width={320}
                height={400}
              />
            </div>
          )}
        </form>
      ) : (
        <div className="text-center text-gray-400 py-4 border border-gray-800 rounded-lg">
          Please log in to comment
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">
                    {comment.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{comment.username}</span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-pink-500 transition-colors"
                      disabled={!token}
                    >
                      <Heart 
                        size={16} 
                        className={comment.user_has_liked ? 'fill-pink-500 text-pink-500' : ''} 
                      />
                      {comment.like_count || 0}
                    </button>
                    {user && comment.user_id === user.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
