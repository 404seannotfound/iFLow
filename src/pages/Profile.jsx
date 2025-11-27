import { useState, useEffect } from 'react';
import { User, Edit2, Save, X } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export default function Profile() {
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setFormData({
        display_name: response.data.display_name || '',
        bio: response.data.bio || '',
        location: response.data.location || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`/api/users/${user.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="card text-center">
          <p className="text-gray-400">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-flow-purple to-flow-pink rounded-full flex items-center justify-center">
              <User className="text-white" size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.display_name || profile.username}</h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    display_name: profile.display_name || '',
                    bio: profile.bio || '',
                    location: profile.location || ''
                  });
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            {editing ? (
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="input-field"
                placeholder="Your display name"
              />
            ) : (
              <p className="text-gray-300">{profile.display_name || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            {editing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input-field"
                rows="4"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-300">{profile.bio || 'No bio yet'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            {editing ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
                placeholder="Your location"
              />
            ) : (
              <p className="text-gray-300">{profile.location || 'Not set'}</p>
            )}
          </div>

          <div className="pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-gray-300">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Member since:</span>
                <span className="text-gray-300">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
