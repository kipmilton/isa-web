// Mapbox Configuration
// Get your access token from: https://account.mapbox.com/access-tokens/
export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN',
  style: 'mapbox://styles/mapbox/streets-v12',
  defaultCenter: [36.8219, -1.2921], // Nairobi coordinates
  defaultZoom: 10,
  geocodingBaseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  reverseGeocodingBaseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places'
};

// Helper function to check if Mapbox is properly configured
export const isMapboxConfigured = (): boolean => {
  return MAPBOX_CONFIG.accessToken !== 'YOUR_MAPBOX_ACCESS_TOKEN' && 
         MAPBOX_CONFIG.accessToken !== undefined && 
         MAPBOX_CONFIG.accessToken !== '';
};

// Helper function to get Mapbox access token with validation
export const getMapboxAccessToken = (): string => {
  if (!isMapboxConfigured()) {
    console.warn('Mapbox access token not configured. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file');
    return '';
  }
  return MAPBOX_CONFIG.accessToken;
}; 