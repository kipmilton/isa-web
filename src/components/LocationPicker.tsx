import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Crosshair, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Map,
  Globe,
  Home,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMapboxAccessToken, isMapboxConfigured } from '@/config/mapbox';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  county?: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location | null;
  title?: string;
  description?: string;
  placeholder?: string;
  className?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  selectedLocation,
  title = "Select Location",
  description = "Choose where you want to deliver or pick up your item",
  placeholder = "Search for a location...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize Mapbox when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      };
      document.head.appendChild(script);
    }
  }, []);

  // Initialize map when dialog opens
  useEffect(() => {
    if (isOpen && mapContainerRef.current && typeof window !== 'undefined' && window.mapboxgl) {
      if (!mapInstance) {
        const accessToken = getMapboxAccessToken();
        if (!accessToken) {
          toast({
            title: "Mapbox not configured",
            description: "Please set up your Mapbox access token in the configuration",
            variant: "destructive"
          });
          return;
        }

        const map = new window.mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [36.8219, -1.2921], // Nairobi coordinates
          zoom: 10,
          accessToken: accessToken
        });

        map.on('load', () => {
          setMapInstance(map);
          
          // Add marker if location is already selected
          if (selectedLocation) {
            addMarkerToMap(map, selectedLocation.latitude, selectedLocation.longitude);
          }
        });

        // Handle map clicks
        map.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;
          addMarkerToMap(map, lat, lng);
          reverseGeocode(lat, lng);
        });
      }
    }
  }, [isOpen, selectedLocation]);

  const addMarkerToMap = (map: any, lat: number, lng: number) => {
    // Remove existing marker
    if (marker) {
      marker.remove();
    }

    // Add new marker
    const newMarker = new window.mapboxgl.Marker({
      color: '#f97316',
      scale: 1.2
    })
      .setLngLat([lng, lat])
      .addTo(map);

    setMarker(newMarker);
  };

  const getCurrentLocation = async () => {
    setIsGettingCurrentLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      });
      setIsGettingCurrentLocation(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Add marker to map
      if (mapInstance) {
        addMarkerToMap(mapInstance, latitude, longitude);
        mapInstance.flyTo({ center: [longitude, latitude], zoom: 15 });
      }

      // Reverse geocode to get address
      await reverseGeocode(latitude, longitude);
      
      toast({
        title: "Location found!",
        description: "Your current location has been set",
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      toast({
        title: "Location error",
        description: "Could not get your current location. Please try again or search manually.",
        variant: "destructive"
      });
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const accessToken = getMapboxAccessToken();
      if (!accessToken) return;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&country=KE&types=poi,address&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Error searching locations:', error);
      toast({
        title: "Search error",
        description: "Could not search for locations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const accessToken = getMapboxAccessToken();
      if (!accessToken) return;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&types=poi,address&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const location: Location = {
          latitude: lat,
          longitude: lng,
          address: feature.place_name,
          city: feature.context?.find((ctx: any) => ctx.id.startsWith('place'))?.text,
          county: feature.context?.find((ctx: any) => ctx.id.startsWith('region'))?.text
        };
        
        onLocationSelect(location);
        setSearchQuery(feature.place_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleSearchResultClick = (result: any) => {
    const [lng, lat] = result.center;
    
    if (mapInstance) {
      addMarkerToMap(mapInstance, lat, lng);
      mapInstance.flyTo({ center: [lng, lat], zoom: 15 });
    }
    
    const location: Location = {
      latitude: lat,
      longitude: lng,
      address: result.place_name,
      city: result.context?.find((ctx: any) => ctx.id.startsWith('place'))?.text,
      county: result.context?.find((ctx: any) => ctx.id.startsWith('region'))?.text
    };
    
    onLocationSelect(location);
    setSearchQuery(result.place_name);
    setSearchResults([]);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setIsOpen(false);
      toast({
        title: "Location confirmed!",
        description: "Your location has been set successfully.",
      });
    }
  };

  const formatAddress = (address: string) => {
    return address.length > 50 ? `${address.substring(0, 50)}...` : address;
  };

  return (
    <>
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">{title}</Label>
              {selectedLocation ? (
                <p className="text-sm text-gray-600 mt-1">
                  {formatAddress(selectedLocation.address)}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
            <Badge variant={selectedLocation ? "default" : "secondary"}>
              {selectedLocation ? "Selected" : "Not set"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <span>{title}</span>
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="map" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map" className="flex items-center space-x-2">
                <Map className="w-4 h-4" />
                <span>Map View</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  onClick={getCurrentLocation}
                  disabled={isGettingCurrentLocation}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {isGettingCurrentLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crosshair className="w-4 h-4" />
                  )}
                  <span>Use Current Location</span>
                </Button>
              </div>

              <div className="relative h-96 rounded-lg overflow-hidden border">
                <div ref={mapContainerRef} className="w-full h-full" />
                {!mapInstance && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600 text-center">
                <p>💡 Click on the map to set your location</p>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search for a location</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchLocations(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Searching...</span>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSearchResultClick(result)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {result.text}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {result.place_name}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {selectedLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Location Selected</p>
                  <p className="text-sm text-green-700 mt-1">{selectedLocation.address}</p>
                  {selectedLocation.city && (
                    <p className="text-xs text-green-600 mt-1">
                      {selectedLocation.city}, {selectedLocation.county}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmLocation}
              disabled={!selectedLocation}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Confirm Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LocationPicker; 