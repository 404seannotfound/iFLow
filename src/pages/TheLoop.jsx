import { Video } from 'lucide-react';

export default function TheLoop() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="card">
        <div className="w-20 h-20 bg-gradient-to-br from-flow-purple to-flow-pink rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Video className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="gradient-text">The Loop</span>
        </h1>
        <p className="text-xl text-gray-400 mb-6">
          Vertical video feed for flow arts skill sharing
        </p>
        <p className="text-gray-500">
          Coming soon: Browse videos, save to training plans, and use frame-by-frame analysis tools
        </p>
      </div>
    </div>
  );
}
