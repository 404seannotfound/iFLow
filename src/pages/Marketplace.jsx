import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, DollarSign, MapPin, Tag, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import ImageUpload from '../components/ImageUpload';
import Comments from '../components/Comments';

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'new',
    location: '',
    imageUrl: null
  });
  const { token } = useAuthStore();

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const response = await axios.get('/api/marketplace');
      // API returns { listings: [...] }
      setListings(response.data.listings || response.data || []);
    } catch (error) {
      console.error('Failed to load listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/marketplace', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateForm(false);
      setFormData({ title: '', description: '', price: '', condition: 'new', location: '', imageUrl: null });
      loadListings();
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('Failed to create listing');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center text-gray-400">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="text-gray-400">Buy, sell, and trade flow props</p>
        </div>
        {token && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create Listing
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">Create New Listing</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="LED Poi - Contact Juggling Balls"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Describe your item..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  placeholder="50.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="input-field"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
                placeholder="San Francisco, CA"
              />
            </div>

            <ImageUpload
              onImageSelect={(imageUrl) => setFormData({ ...formData, imageUrl })}
              currentImage={formData.imageUrl}
              label="Product Image"
            />

            <button type="submit" className="btn-primary w-full">
              Create Listing
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <ShoppingBag className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 mb-4">No listings yet</p>
            {token && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mx-auto"
              >
                Create the first listing
              </button>
            )}
          </div>
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="card hover:border-orange-500/50 transition-colors">
              {listing.image_url && (
                <img 
                  src={listing.image_url} 
                  alt={listing.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2">{listing.title}</h3>
                {listing.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">{listing.description}</p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-500">
                    ${parseFloat(listing.price).toFixed(2)}
                  </span>
                  <span className="text-sm px-3 py-1 bg-gray-800 rounded-full capitalize">
                    {listing.condition?.replace('_', ' ')}
                  </span>
                </div>

                {listing.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin size={14} />
                    {listing.location}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Listed by {listing.seller_username}
                </div>
              </div>

              <div className="space-y-2">
                <button className="btn-secondary w-full">
                  Contact Seller
                </button>
                
                <button
                  onClick={() => setSelectedListing(selectedListing === listing.id ? null : listing.id)}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} />
                  {selectedListing === listing.id ? 'Hide Comments' : 'Show Comments'}
                </button>

                {selectedListing === listing.id && (
                  <div className="pt-4 border-t border-gray-800">
                    <Comments itemType="marketplace" itemId={listing.id} />
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
