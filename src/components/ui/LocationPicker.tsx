import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Search } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// You'll need to set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ.example'; // Replace with your actual token

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number; address: string };
  placeholder?: string;
  className?: string;
}

const LocationPicker = ({ 
  onLocationSelect, 
  initialLocation, 
  placeholder = "Search for a location...",
  className = "" 
}: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(initialLocation || null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [36.8172, -1.2864], // Default to Nairobi
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker if initial location exists
    if (initialLocation) {
      marker.current = new mapboxgl.Marker()
        .setLngLat([initialLocation.lng, initialLocation.lat])
        .addTo(map.current);
    }

    // Handle map click
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      
      try {
        setIsLoading(true);
        
        // Reverse geocode to get address
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        
        const address = data.features[0]?.place_name || 'Unknown location';
        
        const location = { lat, lng, address };
        setSelectedLocation(location);
        onLocationSelect(location);
        
        // Update marker
        if (marker.current) {
          marker.current.setLngLat([lng, lat]);
        } else {
          marker.current = new mapboxgl.Marker()
            .setLngLat([lng, lat])
            .addTo(map.current!);
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        // Still set location even if geocoding fails
        const location = { lat, lng, address: 'Selected location' };
        setSelectedLocation(location);
        onLocationSelect(location);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [initialLocation, onLocationSelect]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !map.current) return;

    try {
      setIsLoading(true);
      
      // Geocode search query
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&country=ke`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        const address = feature.place_name;
        
        const location = { lat, lng, address };
        setSelectedLocation(location);
        onLocationSelect(location);
        
        // Update map
        map.current.flyTo({ center: [lng, lat], zoom: 15 });
        
        // Update marker
        if (marker.current) {
          marker.current.setLngLat([lng, lat]);
        } else {
          marker.current = new mapboxgl.Marker()
            .setLngLat([lng, lat])
            .addTo(map.current);
        }
      }
    } catch (error) {
      console.error('Error geocoding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation || !map.current) return;

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
          );
          const data = await response.json();
          
          const address = data.features[0]?.place_name || 'Current location';
          
          const location = { lat, lng, address };
          setSelectedLocation(location);
          onLocationSelect(location);
          
          // Update map
          map.current!.flyTo({ center: [lng, lat], zoom: 15 });
          
          // Update marker
          if (marker.current) {
            marker.current.setLngLat([lng, lat]);
          } else {
            marker.current = new mapboxgl.Marker()
              .setLngLat([lng, lat])
              .addTo(map.current!);
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          const location = { lat, lng, address: 'Current location' };
          setSelectedLocation(location);
          onLocationSelect(location);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
        setIsLoading(false);
      }
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="flex space-x-2">
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            variant="outline"
            size="icon"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button 
            onClick={useCurrentLocation} 
            disabled={isLoading}
            variant="outline"
            size="icon"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapContainer} 
            className="w-full h-64 rounded-lg"
            style={{ minHeight: '256px' }}
          />
        </CardContent>
      </Card>

      {selectedLocation && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Selected Location</p>
              <p className="text-sm text-gray-600">{selectedLocation.address}</p>
              <p className="text-xs text-gray-500">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-xs text-gray-500 mt-1">Loading...</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 