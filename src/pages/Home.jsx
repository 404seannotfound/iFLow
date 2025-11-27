import { Link } from 'react-router-dom';
import { Video, Calendar, MapPin, ShoppingBag, Sparkles, Users, DollarSign } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Schedule events with conflict detection, RSVP tracking, and safety ratings.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Video,
      title: 'The Loop',
      description: 'Vertical video feed for skill sharing with frame-by-frame analysis tools.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: MapPin,
      title: 'Hub Communities',
      description: 'Join local flow arts communities and stay connected with your scene.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description: 'Buy, sell, and trade props with fellow flow artists in your area.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Sparkles,
      title: 'Skill Development',
      description: 'Save videos to training plans, add annotations, and track your progress.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: DollarSign,
      title: 'Creator Economics',
      description: 'Support instructors through tips, subscriptions, and premium content.',
      color: 'from-pink-500 to-rose-500',
    },
  ];

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

      {/* Features Grid */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need in <span className="gradient-text">One Place</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Built specifically for flow artists, instructors, and organizers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card group hover:scale-105 transition-transform">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="gradient-bg rounded-2xl p-12">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Join the <span className="gradient-text">Flow Revolution</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">10,000+</div>
              <div className="text-gray-400">Global Hubs</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">99.5%</div>
              <div className="text-gray-400">Uptime Target</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">
                <Users className="inline-block" size={36} />
              </div>
              <div className="text-gray-400">Community First</div>
            </div>
          </div>
        </div>
      </section>

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
