import { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Clock, Users, Map, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import MapPicker from '../components/MapPicker';
import MiniMap from '../components/MiniMap';
import Comments from '../components/Comments';
import { formatLocalDateTime } from '../utils/dateUtils';
import RichTextEditor from '../components/RichTextEditor';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Helper to combine date and time into ISO string
  // Parse date parts explicitly to avoid UTC vs local timezone issues
  const combineDateTime = (date, hour, minute) => {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day, parseInt(hour), parseInt(minute), 0, 0);
    return d.toISOString();
  };
  
  // Helper to extract date and time from ISO string (in local timezone)
  const extractDateTime = (isoString) => {
    const d = new Date(isoString);
    // Get local date components
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      hour: d.getHours().toString().padStart(2, '0'),
      minute: d.getMinutes().toString().padStart(2, '0')
    };
  };
  
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15); // Round to next 15 min
    // Use local date components to avoid UTC offset issues
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      hour: now.getHours().toString().padStart(2, '0'),
      minute: now.getMinutes().toString().padStart(2, '0')
    };
  };
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: null,
    longitude: null,
    start_date: '',
    start_hour: '18',
    start_minute: '00',
    end_date: '',
    end_hour: '20',
    end_minute: '00',
    max_participants: ''
  });
  const { token, user } = useAuthStore();

  useEffect(() => {
    loadEvents();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
        }
      );
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const getTimeUntilEvent = (startTime) => {
    const now = new Date();
    const eventDate = new Date(startTime);
    const diff = eventDate - now;
    
    if (diff < 0) return 'Event started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  const loadEvents = async () => {
    try {
      const response = await axios.get('/api/events', token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {});
      // API returns { events: [...] }
      const eventsList = response.data.events || response.data || [];
      console.log('Loaded events with RSVP status:', eventsList.map(e => ({ 
        title: e.title, 
        user_rsvp_status: e.user_rsvp_status 
      })));
      setEvents(eventsList);
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
      const startTime = combineDateTime(formData.start_date, formData.start_hour, formData.start_minute);
      const endTime = combineDateTime(formData.end_date, formData.end_hour, formData.end_minute);
      
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startTime,
        endTime,
        maxAttendees: formData.max_participants ? parseInt(formData.max_participants) : null,
        hubId: null,
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
        start_date: '',
        start_hour: '18',
        start_minute: '00',
        end_date: '',
        end_hour: '20',
        end_minute: '00',
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

  const handleClearRSVP = async (eventId) => {
    try {
      await axios.delete(`/api/events/${eventId}/rsvp`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to clear RSVP:', error);
      alert('Failed to clear RSVP: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event.id);
    const startDT = extractDateTime(event.start_time);
    const endDT = extractDateTime(event.end_time);
    setFormData({
      title: event.title,
      description: event.description || '',
      location: event.location,
      latitude: null,
      longitude: null,
      start_date: startDT.date,
      start_hour: startDT.hour,
      start_minute: startDT.minute,
      end_date: endDT.date,
      end_hour: endDT.hour,
      end_minute: endDT.minute,
      max_participants: event.max_attendees || ''
    });
    setShowCreateForm(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const startTime = combineDateTime(formData.start_date, formData.start_hour, formData.start_minute);
      const endTime = combineDateTime(formData.end_date, formData.end_hour, formData.end_minute);
      
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startTime,
        endTime,
        maxAttendees: formData.max_participants ? parseInt(formData.max_participants) : null,
        hubId: null,
        isFireEvent: false
      };
      
      await axios.put(`/api/events/${editingEvent}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateForm(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        location: '',
        latitude: null,
        longitude: null,
        start_date: '',
        start_hour: '18',
        start_minute: '00',
        end_date: '',
        end_hour: '20',
        end_minute: '00',
        max_participants: ''
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event: ' + (error.response?.data?.error?.message || error.message));
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
          <p className="text-gray-400">Community gatherings, meetings, and neighborhood events</p>
        </div>
        {token && !showCreateForm && (
          <button
            onClick={() => {
              const defaultStart = getDefaultDateTime();
              const defaultEnd = getDefaultDateTime();
              defaultEnd.hour = (parseInt(defaultStart.hour) + 2).toString().padStart(2, '0');
              
              setFormData({
                title: '',
                description: '',
                location: '',
                latitude: null,
                longitude: null,
                start_date: defaultStart.date,
                start_hour: defaultStart.hour,
                start_minute: defaultStart.minute,
                end_date: defaultEnd.date,
                end_hour: defaultEnd.hour,
                end_minute: defaultEnd.minute,
                max_participants: ''
              });
              setShowCreateForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create Event
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
          <form onSubmit={editingEvent ? handleUpdateEvent : handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="Block Party on Oak Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData({ ...formData, description: val })}
                placeholder="Tell neighbors about the event... (paste screenshots!)"
                compact={true}
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

            {/* Start Date & Time */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date & Time 
                <span className="text-xs text-gray-400 ml-2">
                  ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field col-span-2"
                />
                <div className="flex gap-2">
                  <select
                    value={formData.start_hour}
                    onChange={(e) => setFormData({ ...formData, start_hour: e.target.value })}
                    className="input-field flex-1"
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-2xl text-gray-400">:</span>
                  <select
                    value={formData.start_minute}
                    onChange={(e) => setFormData({ ...formData, start_minute: e.target.value })}
                    className="input-field flex-1"
                  >
                    {['00', '15', '30', '45'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-sm font-medium mb-2">
                End Date & Time
                <span className="text-xs text-gray-400 ml-2">
                  ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field col-span-2"
                />
                <div className="flex gap-2">
                  <select
                    value={formData.end_hour}
                    onChange={(e) => setFormData({ ...formData, end_hour: e.target.value })}
                    className="input-field flex-1"
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-2xl text-gray-400">:</span>
                  <select
                    value={formData.end_minute}
                    onChange={(e) => setFormData({ ...formData, end_minute: e.target.value })}
                    className="input-field flex-1"
                  >
                    {['00', '15', '30', '45'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
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
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingEvent(null);
                  setFormData({
                    title: '',
                    description: '',
                    location: '',
                    latitude: null,
                    longitude: null,
                    start_date: '',
                    start_hour: '18',
                    start_minute: '00',
                    end_date: '',
                    end_hour: '20',
                    end_minute: '00',
                    max_participants: ''
                  });
                }}
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
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    location: '',
                    latitude: null,
                    longitude: null,
                    start_date: '',
                    start_hour: '18',
                    start_minute: '00',
                    end_date: '',
                    end_hour: '20',
                    end_minute: '00',
                    max_participants: ''
                  });
                  setShowCreateForm(true);
                }}
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
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                  {event.description && (
                    <div 
                      className="prose prose-invert prose-sm max-w-none mb-4 text-gray-400"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  )}
                </div>
                {token && user && event.created_by === user.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="btn-secondary flex items-center gap-2 text-red-400 hover:text-red-300 hover:border-red-500/50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  {event.location}
                  {userLocation && event.latitude && event.longitude && (
                    <span className="text-xs text-gray-500">
                      ({calculateDistance(userLocation.latitude, userLocation.longitude, event.latitude, event.longitude)} mi away)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <div className="flex flex-col">
                    <span>{formatLocalDateTime(event.start_time)}</span>
                    <span className="text-xs text-gray-500">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </div>
                  <span className="text-purple-400 font-semibold">
                    {getTimeUntilEvent(event.start_time)}
                  </span>
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
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleRSVP(event.id, 'going')}
                      className={`flex-1 min-w-[120px] ${event.user_rsvp_status === 'going' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {event.user_rsvp_status === 'going' ? '✓ ' : ''}Going
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'interested')}
                      className={`flex-1 min-w-[120px] ${event.user_rsvp_status === 'interested' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {event.user_rsvp_status === 'interested' ? '✓ ' : ''}Interested
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'not_going')}
                      className={`flex-1 min-w-[120px] ${event.user_rsvp_status === 'not_going' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {event.user_rsvp_status === 'not_going' ? '✓ ' : ''}Can't Go
                    </button>
                    {event.user_rsvp_status && (
                      <button
                        onClick={() => handleClearRSVP(event.id)}
                        className="btn-secondary px-4"
                        title="Clear your response"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                  {!event.user_rsvp_status && event.created_by !== user?.id && (
                    <p className="text-xs text-gray-500 text-center">
                      No response yet - let others know if you're coming!
                    </p>
                  )}
                  {event.created_by === user?.id && (
                    <p className="text-xs text-purple-400 text-center">
                      You created this event
                    </p>
                  )}
                </div>
              )}

              {selectedEvent === event.id && (
                <div className="pt-4 border-t border-gray-800">
                  <Comments itemType="events" itemId={event.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
