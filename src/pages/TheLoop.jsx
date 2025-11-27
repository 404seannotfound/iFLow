import { useState, useEffect } from 'react';
import { Video, Heart, Eye, Plus, Upload } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export default function TheLoop() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: ''
  });
  const { token } = useAuthStore();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await axios.get('/api/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/videos', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowUploadForm(false);
      setFormData({ title: '', description: '', video_url: '' });
      loadVideos();
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Failed to upload video');
    }
  };

  const handleLike = async (videoId) => {
    try {
      await axios.post(`/api/videos/${videoId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadVideos();
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center text-gray-400">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">The Loop</span>
          </h1>
          <p className="text-gray-400">Vertical video feed for flow arts skill sharing</p>
        </div>
        {token && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Upload size={20} />
            Upload Video
          </button>
        )}
      </div>

      {showUploadForm && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">Upload Video</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="My awesome flow session"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Describe your video..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Video URL</label>
              <input
                type="url"
                required
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="input-field"
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 For now, paste a YouTube, Vimeo, or direct video URL
              </p>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary flex-1">
                Upload Video
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <Video className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 mb-4">No videos yet</p>
            {token && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="btn-primary mx-auto"
              >
                Upload the first video
              </button>
            )}
          </div>
        ) : (
          videos.map((video) => (
            <div key={video.id} className="card hover:border-purple-500/50 transition-colors">
              <div className="aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                <Video className="text-gray-600" size={48} />
              </div>

              <h3 className="text-lg font-bold mb-2">{video.title}</h3>
              {video.description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{video.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => token && handleLike(video.id)}
                    className="flex items-center gap-1 hover:text-pink-500 transition-colors"
                    disabled={!token}
                  >
                    <Heart size={16} className={video.user_has_liked ? 'fill-pink-500 text-pink-500' : ''} />
                    {video.like_count || 0}
                  </button>
                  <div className="flex items-center gap-1">
                    <Eye size={16} />
                    {video.view_count || 0}
                  </div>
                </div>
                <span className="text-xs">by {video.username}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
