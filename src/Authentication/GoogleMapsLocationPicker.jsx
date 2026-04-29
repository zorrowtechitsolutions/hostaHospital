import React, { useRef, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

export default function GoogleMapsLocationPicker({
  latitude,
  longitude,
  onLocationSelect
}) {
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const center = {
    lat: parseFloat(latitude) || 20.5937,
    lng: parseFloat(longitude) || 78.9629
  };

  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      mapRef.current.panTo({
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      });
    }
  }, [latitude, longitude]);

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          onLocationSelect(lat, lng, results[0].formatted_address);
        } else {
          onLocationSelect(lat, lng, '');
        }
      }
    );
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '400px' }}
      center={center}
      zoom={15}
      onClick={handleMapClick}
      onLoad={(map) => (mapRef.current = map)}  // ✅ capture map instance
    >
      <Marker position={center} />
    </GoogleMap>
  );
}