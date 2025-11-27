import { MapPin } from 'lucide-react';

export default function Hubs() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="card">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MapPin className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="gradient-text">Hubs</span>
        </h1>
        <p className="text-xl text-gray-400 mb-6">
          Connect with local flow arts communities
        </p>
        <p className="text-gray-500">
          Coming soon: Join hubs, view members, and stay connected with your local scene
        </p>
      </div>
    </div>
  );
}
