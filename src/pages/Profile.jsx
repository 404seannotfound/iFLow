import { useState, useEffect } from 'react';
import { User, Edit2, Save, X, Key, Upload } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import ImageUpload from '../components/ImageUpload';

export default function Profile() {
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: '',
    avatar_url: null
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
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
      // API returns { user: {...} }
      const userData = response.data.user || response.data;
      setProfile(userData);
      setFormData({
        display_name: userData.display_name || '',
        bio: userData.bio || '',
        location: userData.location || '',
        avatar_url: userData.avatar_url || null
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      await axios.put(`/api/users/${user.id}/password`, {
        currentPassword: passwordData.current_password,
        newPassword: passwordData.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowPasswordChange(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert(error.response?.data?.error?.message || 'Failed to change password');
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
            {profile.avatar_url || formData.avatar_url ? (
              <img 
                src={formData.avatar_url || profile.avatar_url} 
                alt={profile.username}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-flow-purple to-flow-pink rounded-full flex items-center justify-center">
                <User className="text-white" size={40} />
              </div>
            )}
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

          {editing && (
            <div>
              <ImageUpload
                onImageSelect={(avatar_url) => setFormData({ ...formData, avatar_url })}
                currentImage={formData.avatar_url}
                label="Profile Picture"
              />
            </div>
          )}

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

          <div className="pt-6 border-t border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              {!showPasswordChange && (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Key size={16} />
                  Change Password
                </button>
              )}
            </div>

            {showPasswordChange && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="input-field"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="input-field"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="input-field"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
