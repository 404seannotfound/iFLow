import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Users, ArrowLeft, Plus, Heart, MessageCircle, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import RichTextEditor from '../components/RichTextEditor';
import Comments from '../components/Comments';

export default function HubDetail() {
  const { hubId } = useParams();
  const [hub, setHub] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const { token, user } = useAuthStore();

  useEffect(() => {
    loadHub();
    loadPosts();
  }, [hubId]);

  const loadHub = async () => {
    try {
      const response = await axios.get(`/api/hubs/${hubId}`);
      setHub(response.data.hub || response.data);
    } catch (error) {
      console.error('Failed to load hub:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await axios.get(`/api/hubs/${hubId}/posts`);
      setPosts(response.data.posts || response.data || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
      setPosts([]);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() || !token) return;

    try {
      await axios.post(`/api/hubs/${hubId}/posts`, 
        { content: postContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPostContent('');
      setShowCreatePost(false);
      loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleLikePost = async (postId) => {
    if (!token) return;
    try {
      await axios.post(`/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadPosts();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleJoinHub = async () => {
    if (!token) return;
    try {
      await axios.post(`/api/hubs/${hubId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadHub();
    } catch (error) {
      console.error('Failed to join hub:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center text-gray-400">Loading hub...</div>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="card text-center">
          <p className="text-gray-400 mb-4">Hub not found</p>
          <Link to="/hubs" className="btn-primary inline-block">
            Back to Hubs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Back Button */}
      <Link to="/hubs" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} />
        Back to Hubs
      </Link>

      {/* Hub Header */}
      <div className="card mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{hub.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  {hub.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  {hub.member_count || 0} members
                </div>
              </div>
            </div>
          </div>
          {token && !hub.is_member && (
            <button onClick={handleJoinHub} className="btn-primary">
              Join Hub
            </button>
          )}
        </div>
        {hub.description && (
          <p className="text-gray-300">{hub.description}</p>
        )}
      </div>

      {/* Create Post Section */}
      {token && hub.is_member && (
        <div className="card mb-8">
          {!showCreatePost ? (
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
            >
              What's on your mind?
            </button>
          ) : (
            <form onSubmit={handleCreatePost} className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Create Post</h3>
              <RichTextEditor
                value={postContent}
                onChange={setPostContent}
                placeholder="Share something with the community..."
              />
              <div className="flex gap-4">
                <button type="submit" className="btn-primary flex-1">
                  <Plus size={20} className="inline mr-2" />
                  Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePost(false);
                    setPostContent('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">
          <span className="gradient-text">Community Feed</span>
        </h2>

        {posts.length === 0 ? (
          <div className="card text-center py-12">
            <MessageCircle className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 mb-4">No posts yet</p>
            {token && hub.is_member && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="btn-primary mx-auto"
              >
                Create the first post
              </button>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="card">
              {/* Post Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {post.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{post.username}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div 
                className="prose prose-invert max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Post Actions */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-800">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors"
                  disabled={!token}
                >
                  <Heart 
                    size={20} 
                    className={post.user_has_liked ? 'fill-pink-500 text-pink-500' : ''} 
                  />
                  <span>{post.like_count || 0}</span>
                </button>
                <button
                  onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                  className="flex items-center gap-2 text-gray-400 hover:text-purple-500 transition-colors"
                >
                  <MessageCircle size={20} />
                  <span>{post.comment_count || 0}</span>
                </button>
              </div>

              {/* Comments Section */}
              {selectedPost === post.id && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <Comments itemType="posts" itemId={post.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
