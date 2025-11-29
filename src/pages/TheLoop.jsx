import { useState, useEffect } from 'react';
import { Video, Plus, Heart, Play, MessageCircle, Eye, Upload, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import Comments from '../components/Comments';
import RichTextEditor from '../components/RichTextEditor';

export default function TheLoop() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: ''
  });
  const { token } = useAuthStore();

  // Extract video ID and generate thumbnail for YouTube/Vimeo
  const getVideoThumbnail = (url) => {
    if (!url) return null;
    
    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
    
    // Vimeo pattern
    const vimeoMatch = url.match(/vimeo\.com\/([0-9]+)/);
    if (vimeoMatch) {
      // Vimeo requires API call for thumbnail, use placeholder
      return null;
    }
    
    return null;
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await axios.get('/api/videos');
      // API returns { videos: [...] }
      setVideos(response.data.videos || response.data || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert to API format (camelCase)
      const payload = {
        title: formData.title,
        description: formData.description,
        videoUrl: formData.video_url
      };
      await axios.post('/api/videos', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowUploadForm(false);
      setFormData({ title: '', description: '', video_url: '' });
      loadVideos();
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Failed to upload video: ' + (error.response?.data?.error?.message || error.message));
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
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData({ ...formData, description: val })}
                placeholder="Describe your video... (paste screenshots here!)"
                compact={true}
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
              <a 
                href={video.video_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block aspect-video bg-gray-800 rounded-lg mb-4 relative overflow-hidden group"
              >
                {getVideoThumbnail(video.video_url) ? (
                  <>
                    <img 
                      src={getVideoThumbnail(video.video_url)} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                        <Play className="text-white" size={32} fill="white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1">
                      <ExternalLink size={14} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="text-gray-600" size={48} />
                  </div>
                )}
              </a>

              <h3 className="text-lg font-bold mb-2">{video.title}</h3>
              {video.description && (
                <div 
                  className="prose prose-invert prose-sm max-w-none mb-4 text-gray-400 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: video.description }}
                />
              )}

              <div className="space-y-2">
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

                <button
                  onClick={() => setSelectedVideo(selectedVideo === video.id ? null : video.id)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2"
                >
                  <MessageCircle size={14} />
                  {selectedVideo === video.id ? 'Hide Comments' : 'Show Comments'}
                </button>

                {selectedVideo === video.id && (
                  <div className="pt-4 border-t border-gray-800">
                    <Comments itemType="videos" itemId={video.id} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
