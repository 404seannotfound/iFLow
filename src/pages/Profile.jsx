import { User } from 'lucide-react';

export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="card">
        <div className="w-20 h-20 bg-gradient-to-br from-flow-purple to-flow-pink rounded-2xl flex items-center justify-center mx-auto mb-6">
          <User className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-xl text-gray-400 mb-6">
          View and edit your profile
        </p>
        <p className="text-gray-500">
          Coming soon: Profile customization, verification badges, and external links
        </p>
      </div>
    </div>
  );
}
