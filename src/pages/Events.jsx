import { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Clock, Users, Map, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import MapPicker from '../components/MapPicker';
import MiniMap from '../components/MiniMap';
import Comments from '../components/Comments';
import { formatLocalDateTime } from '../utils/dateUtils';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: null,
    longitude: null,
    start_time: '',
    end_time: '',
    max_participants: ''
  });
  const { token } = useAuthStore();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      // API returns { events: [...] }
      setEvents(response.data.events || response.data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
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
        location: formData.location,
        startTime: formData.start_time,
        endTime: formData.end_time,
        maxAttendees: formData.max_participants ? parseInt(formData.max_participants) : null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        hubId: null, // Optional - can be set to a specific hub
        isFireEvent: false
      };
      
      await axios.post('/api/events', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateForm(false);
      setShowMap(false);
      setFormData({
        title: '',
        description: '',
        location: '',
        latitude: null,
        longitude: null,
        start_time: '',
        end_time: '',
        max_participants: ''
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      const errorMsg = error.response?.data?.error?.message || error.message;
      alert('Failed to create event: ' + errorMsg);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await axios.post(`/api/events/${eventId}/rsvp`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to RSVP:', error);
      alert('Failed to RSVP: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center text-gray-400">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Events</span>
          </h1>
          <p className="text-gray-400">Schedule and discover flow arts events</p>
        </div>
        {token && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create Event
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="Weekly Flow Jam"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Join us for a fun flow session..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field"
                  placeholder="Central Park, NYC"
                  readOnly={showMap}
                />
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Map size={18} />
                  {showMap ? 'Hide Map' : 'Pick Location on Map'}
                </button>
              </div>
            </div>

            {showMap && (
              <MapPicker
                onLocationSelect={(location) => {
                  setFormData({
                    ...formData,
                    location: location.address,
                    latitude: location.lat,
                    longitude: location.lng
                  });
                }}
                initialPosition={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : null}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Participants (optional)</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                className="input-field"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary flex-1">
                Create Event
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

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 mb-4">No events yet</p>
            {token && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mx-auto"
              >
                Create the first event
              </button>
            )}
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="card hover:border-purple-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-400 mb-4">{event.description}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  {event.location}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  {new Date(event.start_time).toLocaleString()}
                </div>
                {event.max_participants && (
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    {event.rsvp_count || 0} / {event.max_participants}
                  </div>
                )}
              </div>

              {event.latitude && event.longitude && (
                <MiniMap latitude={event.latitude} longitude={event.longitude} />
              )}

              {token && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRSVP(event.id, 'going')}
                      className="btn-primary flex-1"
                    >
                      Going
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'interested')}
                      className="btn-secondary flex-1"
                    >
                      Interested
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'not_going')}
                      className="btn-secondary flex-1"
                    >
                      Can't Go
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    {selectedEvent === event.id ? 'Hide Comments' : 'Show Comments'}
                  </button>

                  {selectedEvent === event.id && (
                    <div className="pt-4 border-t border-gray-800">
                      <Comments itemType="events" itemId={event.id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
