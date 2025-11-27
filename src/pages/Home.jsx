import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { formatLocalDateTime } from '../utils/dateUtils';

export default function Home() {
  const { user, token } = useAuthStore();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myHubs, setMyHubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserContent();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserContent = async () => {
    try {
      // Load upcoming events
      const eventsRes = await axios.get('/api/events');
      const events = eventsRes.data.events || [];
      const upcoming = events
        .filter(e => new Date(e.start_time) > new Date())
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, 3);
      setUpcomingEvents(upcoming);

      // Load user's hubs
      const hubsRes = await axios.get('/api/hubs');
      const hubs = hubsRes.data.hubs || [];
      const userHubs = hubs.filter(h => h.is_member).slice(0, 3);
      setMyHubs(userHubs);
    } catch (error) {
      console.error('Failed to load user content:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold">
            <span className="gradient-text">Welcome to iFlow</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            The unified platform for the flow arts community. Replace Facebook, Instagram, and Patreon
            with one purpose-built ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <Link to="/loop" className="btn-outline text-lg px-8 py-3">
              Explore The Loop
            </Link>
          </div>
        </div>
      </section>

      {/* User Content Section - Only show when logged in */}
      {user && (
        <section className="space-y-8">
          {/* Upcoming Events */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">
                <span className="gradient-text">Upcoming Events</span>
              </h2>
              <Link to="/events" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
                View All <ArrowRight size={18} />
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading events...</div>
            ) : upcomingEvents.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="card hover:border-purple-500/50 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="text-white" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{event.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{event.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      {formatLocalDateTime(event.start_time)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <Calendar className="mx-auto mb-3 text-gray-600" size={40} />
                <p className="text-gray-400 mb-4">No upcoming events</p>
                <Link to="/events" className="btn-primary inline-block">
                  Browse Events
                </Link>
              </div>
            )}
          </div>

          {/* My Hubs */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">
                <span className="gradient-text">My Hubs</span>
              </h2>
              <Link to="/hubs" className="text-green-400 hover:text-green-300 flex items-center gap-2">
                View All <ArrowRight size={18} />
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading hubs...</div>
            ) : myHubs.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {myHubs.map((hub) => (
                  <div key={hub.id} className="card hover:border-green-500/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-white" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{hub.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{hub.location}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {hub.member_count || 0} members
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <MapPin className="mx-auto mb-3 text-gray-600" size={40} />
                <p className="text-gray-400 mb-4">You haven't joined any hubs yet</p>
                <Link to="/hubs" className="btn-primary inline-block">
                  Explore Hubs
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="text-center py-12">
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Flow?</h2>
          <p className="text-gray-400 mb-6">
            Join iFlow today and connect with flow artists worldwide. Share your skills, find events,
            and support the community.
          </p>
          <Link to="/register" className="btn-primary text-lg px-8 py-3 inline-block">
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}
