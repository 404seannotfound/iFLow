import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, setAddress }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      
      // Reverse geocode to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            setAddress(data.display_name);
          }
        })
        .catch(err => console.error('Geocoding error:', err));
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function MapPicker({ onLocationSelect, initialPosition = null }) {
  const [position, setPosition] = useState(initialPosition || [37.7749, -122.4194]); // Default to SF
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (position && address) {
      onLocationSelect({
        lat: position[0],
        lng: position[1],
        address: address
      });
    }
  }, [position, address, onLocationSelect]);

  // Get user's current location
  useEffect(() => {
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          
          // Get address for current location
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) {
                setAddress(data.display_name);
              }
            })
            .catch(err => console.error('Geocoding error:', err));
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, [initialPosition]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newPos = [parseFloat(result.lat), parseFloat(result.lon)];
        setPosition(newPos);
        setAddress(result.display_name);
      } else {
        alert('Location not found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search location');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Search Location</label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a city, address, or landmark..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={searching}
            className="btn-secondary px-6"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Click on the map to select exact location
        </label>
        <div className="rounded-lg overflow-hidden border border-gray-700" style={{ height: '400px' }}>
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            key={`${position[0]}-${position[1]}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker 
              position={position} 
              setPosition={setPosition}
              setAddress={setAddress}
            />
          </MapContainer>
        </div>
      </div>

      {address && (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Selected Location:</p>
          <p className="text-white">{address}</p>
          <p className="text-xs text-gray-500 mt-2">
            Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        💡 Tip: Search for a general area, then click on the map to pinpoint the exact location
      </p>
    </div>
  );
}
