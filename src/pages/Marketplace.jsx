import { ShoppingBag } from 'lucide-react';

export default function Marketplace() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="card">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="gradient-text">Marketplace</span>
        </h1>
        <p className="text-xl text-gray-400 mb-6">
          Buy, sell, and trade flow props
        </p>
        <p className="text-gray-500">
          Coming soon: Browse listings, filter by prop type and location, and connect with sellers
        </p>
      </div>
    </div>
  );
}
