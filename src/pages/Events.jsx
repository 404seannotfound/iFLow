import { Calendar } from 'lucide-react';

export default function Events() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="card">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Calendar className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="gradient-text">Events</span>
        </h1>
        <p className="text-xl text-gray-400 mb-6">
          Schedule and discover flow arts events
        </p>
        <p className="text-gray-500">
          Coming soon: Event scheduling with conflict detection, RSVP tracking, and safety ratings
        </p>
      </div>
    </div>
  );
}
