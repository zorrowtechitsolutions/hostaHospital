// src/components/Settings/Map.jsx - With toast notifications and API integration
import {
  useState,
  useEffect
} from 'react';
import { Button, Card, Input, Textarea, Alert } from '../ui';
import GoogleMapsLocationPicker from '@/Authentication/GoogleMapsLocationPicker';
import {
  showSuccessToast,
  showWarningToast,
  showErrorToast,
  showInfoToast
} from '../ui/Toast';
import { useGetHospitalByIdQuery, useUpdateHospitalMutation } from '../../../app/service/hospitalApi';
import { getHospitalId, getAuthUser } from '../../utils/auth';

// Constants
const DATE_FORMAT_OPTIONS = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true
};

const STATUS_CLEAR_DELAY = 3000;
const ACTION_BUTTON_CLASS = 'flex items-center justify-center gap-2';

// Location status alert configuration
const LOCATION_ALERTS = {
  loading: {
    type: 'info',
    message: '📍 Getting your location...'
  },
  success: {
    type: 'success',
    message: '✓ Location selected successfully!'
  },
  saved: {
    type: 'success',
    message: '✓ Location saved successfully!'
  },
  error: {
    type: 'error',
    message: '❌ Failed to get location. Please try again.'
  }
};

// Location Icon Component
const LocationIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Edit Icon Component
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

// Copy Icon Component
const CopyIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

// Helper function to build address from address object
const buildAddress = (address) => {
  if (!address) return '';
  return [
    address.place,
    address.district,
    address.state,
    address.country,
    address.pincode
  ]
    .filter(Boolean)
    .join(', ');
};

// Helper function to clear status with timeout
const clearStatusAfterDelay = (setStatus, delay = STATUS_CLEAR_DELAY) => {
  setTimeout(() => {
    setStatus('');
  }, delay);
};

const Map = () => {
  // Get hospitalId from auth utility
  const hospitalId = getHospitalId();
  const authUser = getAuthUser();

  // Fetch hospital data
  const { data: hospitalData, isLoading: isLoadingHospital, refetch } = useGetHospitalByIdQuery(hospitalId, {
    skip: !hospitalId,
  });

  const [updateHospital, { isLoading: isUpdating }] = useUpdateHospitalMutation();

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedLocation, setSavedLocation] = useState({
    lat: '',
    lng: '',
    address: '',
    lastUpdated: null
  });

  const isLocationSaving = isSaving || isUpdating;

  // Load hospital data from API
  useEffect(() => {
    if (hospitalData) {
      const hospital = hospitalData.data || hospitalData;
      const hospitalLat = hospital.latitude;
      const hospitalLng = hospital.longitude;

      if (hospitalLat && hospitalLng) {
        setLatitude(hospitalLat.toString());
        setLongitude(hospitalLng.toString());
        setSavedLocation({
          lat: hospitalLat.toString(),
          lng: hospitalLng.toString(),
          address: hospital.address?.place || '',
          lastUpdated: hospital.updatedAt ? new Date(hospital.updatedAt).toLocaleString('en-US', DATE_FORMAT_OPTIONS) : null
        });

        setAddress(buildAddress(hospital.address));
      }
    }
  }, [hospitalData]);

  const handleLocationSelect = (lat, lng, addressText) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    if (addressText) setAddress(addressText);
    setLocationStatus('success');
    showSuccessToast(`Location selected: ${lat}, ${lng}`, STATUS_CLEAR_DELAY);
    clearStatusAfterDelay(setLocationStatus);
  };

  const getCurrentLocation = () => {
    setLocationStatus('loading');
    showInfoToast('Getting your current location...', 2000);

    if (!navigator.geolocation) {
      setLocationStatus('error');
      showErrorToast('Geolocation is not supported by your browser', STATUS_CLEAR_DELAY);
      clearStatusAfterDelay(setLocationStatus);
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
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setAddress(results[0].formatted_address);
              showSuccessToast('Current location detected successfully!', STATUS_CLEAR_DELAY);
            }
          });
        } else {
          showSuccessToast(`Current location: ${lat}, ${lng}`, STATUS_CLEAR_DELAY);
        }

        setLocationStatus('success');
        clearStatusAfterDelay(setLocationStatus);
      },
      (error) => {
        setLocationStatus('error');

        let errorMessage = 'Failed to get location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please try again.';
        }

        showErrorToast(errorMessage, STATUS_CLEAR_DELAY);
        clearStatusAfterDelay(setLocationStatus);
      }
    );
  };

  const handleSaveLocation = async () => {
    if (!latitude || !longitude) {
      showWarningToast('Please select a location before saving', STATUS_CLEAR_DELAY);
      return;
    }

    setIsSaving(true);

    try {
      const hospital = hospitalData?.data || hospitalData;

      const updateData = {
        name: hospital?.name,
        email: hospital?.email,
        type: hospital?.type,
        phone: hospital?.phone,
        address: {
          country: hospital?.address?.country,
          state: hospital?.address?.state,
          district: hospital?.address?.district,
          place: hospital?.address?.place,
          pincode: hospital?.address?.pincode
        },
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        about: hospital?.about
      };

      await updateHospital({
        id: hospitalId,
        updateHospital: updateData
      }).unwrap();

      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', DATE_FORMAT_OPTIONS);

      setSavedLocation({
        lat: latitude,
        lng: longitude,
        address: address,
        lastUpdated: formattedDate
      });

      setIsEditing(false);
      setLocationStatus('saved');

      showSuccessToast(
        'Hospital location saved successfully!',
        STATUS_CLEAR_DELAY,
        {
          'Coordinates': `${latitude}, ${longitude}`,
          'Updated': formattedDate
        }
      );

      refetch();
      clearStatusAfterDelay(setLocationStatus);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to save location', STATUS_CLEAR_DELAY);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCoordinates = async () => {
    if (!savedLocation.lat || !savedLocation.lng) {
      showWarningToast('No coordinates saved yet', 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(`${savedLocation.lat}, ${savedLocation.lng}`);
      showSuccessToast('Coordinates copied to clipboard!', 2000);
    } catch {
      showErrorToast('Failed to copy coordinates', 2000);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (savedLocation.lat) {
      setLatitude(savedLocation.lat);
      setLongitude(savedLocation.lng);
      setAddress(savedLocation.address);
    }
    setIsEditing(false);
    showInfoToast('Edit cancelled', 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', DATE_FORMAT_OPTIONS);
  };

  // Show authentication error if no hospital ID
  if (!hospitalId && !isLoadingHospital) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Error</h3>
          <p className="text-gray-500 mb-4">Unable to retrieve hospital information. Please log in again.</p>
          <Button variant="primary" onClick={() => window.location.href = '/sign-in'}>
            Go to Login
          </Button>
        </div>
      </Card>
    );
  }

  // Loading state
  if (isLoadingHospital) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C62A0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {LOCATION_ALERTS[locationStatus] && (
        <Alert {...LOCATION_ALERTS[locationStatus]} />
      )}

      {!isEditing ? (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Hospital Location</h2>
                <p className="text-sm text-gray-500">View your hospital location on the map</p>
              </div>
              <Button variant="primary" onClick={handleEditClick} className={ACTION_BUTTON_CLASS}>
                <EditIcon />
                Edit Location
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
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
                      {savedLocation.lat && savedLocation.lng ? `${savedLocation.lat}, ${savedLocation.lng}` : 'Not set'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                    <p className="text-gray-900">{savedLocation.lastUpdated || 'Not updated yet'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Address</label>
                  <p className="text-gray-900 leading-relaxed">{address || savedLocation.address || 'No address saved'}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://www.google.com/maps?q=${savedLocation.lat},${savedLocation.lng}`, '_blank')}
                  className={ACTION_BUTTON_CLASS}
                  disabled={!savedLocation.lat || !savedLocation.lng}
                >
                  <LocationIcon />
                  Open in Google Maps
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyCoordinates}
                  className={ACTION_BUTTON_CLASS}
                  disabled={!savedLocation.lat || !savedLocation.lng}
                >
                  <CopyIcon />
                  Copy Coordinates
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card>
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
          </Card>

         <div className="flex justify-center">
  <Button
    onClick={getCurrentLocation}
    className="w-56 h-10 rounded-lg border border-[#D6E2EE] bg-[#F5FAFF] text-[#154A7D] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#154A7D] hover:text-white transition-colors"
  >
    <LocationIcon className="w-4 h-4" />
    Get Current Location
  </Button>
</div>

          <Card>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Location Details</h2>
              <p className="text-sm text-gray-500">Review and save your location</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    name="latitude"
                    value={latitude}
                    disabled={true}
                    className="bg-gray-100 cursor-not-allowed"
                    placeholder="Latitude will be auto-filled"
                  />
                  <Input
                    label="Longitude"
                    name="longitude"
                    value={longitude}
                    disabled={true}
                    className="bg-gray-100 cursor-not-allowed"
                    placeholder="Longitude will be auto-filled"
                  />
                </div>
                <Textarea
                  label="Address"
                  name="address"
                  rows={3}
                  value={address}
                  disabled={true}
                  className="bg-gray-100 cursor-not-allowed"
                  placeholder="Address will be auto-filled from map selection"
                />
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveLocation}
                    disabled={isLocationSaving}
                    loading={isLocationSaving}
                  >
                    {isLocationSaving ? 'Saving...' : 'Save Location'}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Map;