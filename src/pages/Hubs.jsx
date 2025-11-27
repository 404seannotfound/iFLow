import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Users, UserPlus, Check } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export default function Hubs() {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  });
  const { token, user } = useAuthStore();

  useEffect(() => {
    loadHubs();
  }, []);

  const loadHubs = async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('/api/hubs', config);
      // API returns { hubs: [...] }
      setHubs(response.data.hubs || response.data || []);
    } catch (error) {
      console.error('Failed to load hubs:', error);
      setHubs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/hubs', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateForm(false);
      setFormData({ name: '', description: '', location: '' });
      loadHubs();
    } catch (error) {
      console.error('Failed to create hub:', error);
      alert('Failed to create hub');
    }
  };

  const handleJoin = async (hubId, e) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    try {
      await axios.post(`/api/hubs/${hubId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadHubs();
    } catch (error) {
      console.error('Failed to join hub:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center text-gray-400">Loading hubs...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Hubs</span>
          </h1>
          <p className="text-gray-400">Connect with local flow arts communities</p>
        </div>
        {token && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create Hub
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">Create New Hub</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hub Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="San Francisco Flow Arts"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="A community for flow artists in the SF Bay Area..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
                placeholder="San Francisco, CA"
              />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary flex-1">
                Create Hub
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hubs.length === 0 ? (
          <div className="col-span-2 card text-center py-12">
            <MapPin className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 mb-4">No hubs yet</p>
            {token && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mx-auto"
              >
                Create the first hub
              </button>
            )}
          </div>
        ) : (
          hubs.map((hub) => (
            <Link key={hub.id} to={`/hubs/${hub.id}`} className="card hover:border-green-500/50 transition-colors block">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{hub.name}</h3>
                    <p className="text-sm text-gray-400">{hub.location}</p>
                  </div>
                </div>
                {token && (
                  hub.is_member ? (
                    <div className="flex items-center gap-2 text-green-500 text-sm">
                      <Check size={16} />
                      Member
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleJoin(hub.id, e)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <UserPlus size={16} />
                      Join
                    </button>
                  )
                )}
              </div>

              {hub.description && (
                <p className="text-gray-400 mb-4">{hub.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  {hub.member_count || 0} members
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} />
                  {hub.post_count || 0} posts
                </div>
              </div>

              {hub.recent_public_post && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Recent activity:</p>
                  <p className="text-sm text-gray-400 line-clamp-2">{hub.recent_public_post}</p>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
