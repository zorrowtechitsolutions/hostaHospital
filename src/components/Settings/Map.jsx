// Map.jsx
import React, { useState, useEffect } from 'react';
import GoogleMapsLocationPicker from '@/Authentication/GoogleMapsLocationPicker';

const Map = () => {
  // Location state
  const [latitude, setLatitude] = useState('11.0360435');
  const [longitude, setLongitude] = useState('76.102219');
  const [address, setAddress] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedLocation, setSavedLocation] = useState({
    lat: '11.0360435',
    lng: '76.102219',
    address: '',
    lastUpdated: null
  });

  // Load saved location from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('hospitalLocation');
    if (saved) {
      const locationData = JSON.parse(saved);
      setLatitude(locationData.lat);
      setLongitude(locationData.lng);
      setAddress(locationData.address || '');
      setSavedLocation({
        lat: locationData.lat,
        lng: locationData.lng,
        address: locationData.address || '',
        lastUpdated: locationData.lastUpdated || new Date().toISOString()
      });
    }
  }, []);

  const handleLocationSelect = (lat, lng, addressText) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    if (addressText) {
      setAddress(addressText);
    }
    setLocationStatus('success');
    setTimeout(() => setLocationStatus(''), 3000);
  };

  const getCurrentLocation = () => {
    setLocationStatus('loading');
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setTimeout(() => setLocationStatus(''), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toString());
        setLongitude(lng.toString());

        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat, lng } },
            (results, status) => {
              if (status === 'OK' && results && results[0]) {
                setAddress(results[0].formatted_address);
              }
            }
          );
        }
        setLocationStatus('success');
        setTimeout(() => setLocationStatus(''), 3000);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationStatus('error');
        setTimeout(() => setLocationStatus(''), 3000);
      }
    );
  };

  const handleSaveLocation = () => {
    if (latitude && longitude) {
      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
      
      const locationData = {
        lat: latitude,
        lng: longitude,
        address: address,
        lastUpdated: formattedDate,
        timestamp: now.toISOString()
      };
      
      localStorage.setItem('hospitalLocation', JSON.stringify(locationData));
      setSavedLocation(locationData);
      setIsEditing(false);
      setLocationStatus('saved');
      setTimeout(() => setLocationStatus(''), 3000);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setLatitude(savedLocation.lat);
    setLongitude(savedLocation.lng);
    setAddress(savedLocation.address);
    setIsEditing(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Location Status Messages */}
      {locationStatus === 'loading' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 text-center">📍 Getting your location...</p>
        </div>
      )}
      {locationStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 text-center">✓ Location selected successfully!</p>
        </div>
      )}
      {locationStatus === 'saved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 text-center">✓ Location saved successfully!</p>
        </div>
      )}
      {locationStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-center">❌ Failed to get location. Please try again.</p>
        </div>
      )}

      {!isEditing ? (
        /* View Mode - Display Saved Location */
        <>
          {/* Location Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Hospital Location</h2>
                  <p className="text-sm text-gray-500">Set your hospital location on the map</p>
                </div>
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 bg-[#1C62A0] hover:bg-[#154A7D] text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Location
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Mini Map Preview */}
                {savedLocation.lat && savedLocation.lng && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      width="100%"
                      height="250"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${savedLocation.lat},${savedLocation.lng}&z=15&output=embed`}
                      allowFullScreen
                      title="Hospital Location Preview"
                    />
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Coordinates</label>
                      <p className="text-gray-900 font-mono text-lg">
                        {savedLocation.lat}, {savedLocation.lng}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                      <p className="text-gray-900">
                        {savedLocation.lastUpdated || formatDate(savedLocation.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Full Address</label>
                    <p className="text-gray-900 leading-relaxed">
                      {savedLocation.address || 'No address saved'}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => {
                      window.open(`https://www.google.com/maps?q=${savedLocation.lat},${savedLocation.lng}`, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Open in Google Maps
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${savedLocation.lat}, ${savedLocation.lng}`);
                      alert('Coordinates copied to clipboard!');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Coordinates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Edit Mode - Show Map Picker */
        <>
          {/* Map Picker Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">Select Location on Map</h2>
              <p className="text-sm text-gray-500">Click on the map to select your hospital location</p>
            </div>
            <div className="p-6">
              <GoogleMapsLocationPicker
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={handleLocationSelect}
              />
              <p className="text-xs text-gray-500 mt-2">💡 Tip: Click anywhere on the map to select a location</p>
            </div>
          </div>

          {/* Get Current Location Button */}
          <button
            onClick={getCurrentLocation}
            className="w-full rounded-xl border border-[#D6E2EE] bg-[#F5FAFF] text-[#154A7D] py-4 font-medium text-lg flex items-center justify-center gap-3 transition-all duration-200 hover:bg-[#154A7D] hover:text-white hover:border-[#154A7D] hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Get Current Location
          </button>

          {/* Location Details Form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Location Details</h2>
              <p className="text-sm text-gray-500">Review and save your location</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0] font-mono"
                      placeholder="Enter latitude"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0] font-mono"
                      placeholder="Enter longitude"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1C62A0] focus:border-[#1C62A0]"
                    placeholder="Hospital address will appear here automatically"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSaveLocation}
                    className="px-6 py-2 bg-[#1C62A0] hover:bg-[#154A7D] text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Save Location
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Map;