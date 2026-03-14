import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocations } from '@/hooks/use-locations';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, Info, Locate, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { api } from '@shared/routes';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  id: number;
  name: string;
  lat: number;
  lon: number;
  aqi?: number;
  category?: string;
  color?: string;
}

function getAQICategory(aqi: number): { category: string; color: string; bgColor: string } {
  if (aqi <= 50) return { category: 'Good', color: 'text-green-700', bgColor: 'bg-green-500' };
  if (aqi <= 100) return { category: 'Moderate', color: 'text-yellow-700', bgColor: 'bg-yellow-500' };
  if (aqi <= 150) return { category: 'Unhealthy (Sensitive)', color: 'text-orange-700', bgColor: 'bg-orange-500' };
  if (aqi <= 200) return { category: 'Unhealthy', color: 'text-red-700', bgColor: 'bg-red-500' };
  if (aqi <= 300) return { category: 'Severe', color: 'text-purple-700', bgColor: 'bg-purple-600' };
  return { category: 'Hazardous', color: 'text-rose-900', bgColor: 'bg-rose-900' };
}

// Create custom colored circular markers
function createColoredIcon(aqi: number): L.DivIcon {
  const aqiInfo = getAQICategory(aqi);
  const color = aqi <= 50 ? '#22c55e' : 
                aqi <= 100 ? '#eab308' :
                aqi <= 150 ? '#f97316' :
                aqi <= 200 ? '#ef4444' :
                aqi <= 300 ? '#a855f7' : '#881337';
  
  return L.divIcon({
    className: 'custom-circular-marker',
    html: `
      <div class="marker-circle" style="
        background: ${color};
        width: 35px;
        height: 35px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <div style="
          color: white;
          font-weight: 900;
          font-size: 12px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        ">${aqi}</div>
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17.5, 17.5],
    popupAnchor: [0, -17.5],
  });
}

// Component to handle map center changes
function MapController({ center, zoom }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (zoom !== undefined) {
      map.setView(center, zoom);
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

// Current location marker with AQI data
function CurrentLocationMarker({ location }: { location: { lat: number; lon: number } }) {
  const [, navigate] = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: [api.weather.get.path, { lat: location.lat, lon: location.lon }],
    queryFn: async () => {
      const res = await fetch(`${api.weather.get.path}?lat=${location.lat}&lon=${location.lon}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const aqi = data?.airQuality?.aqi || 0;
  const aqiInfo = getAQICategory(aqi);
  const locationName = data?.location || 'Your Current Location';

  // Create distinctive icon for current location
  const currentLocationIcon = L.divIcon({
    className: 'current-location-marker',
    html: `
      <div style="position: relative; width: 50px; height: 50px;">
        <!-- Pulsing outer ring -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.2);
          border: 2px solid #3b82f6;
          animation: pulse 2s infinite;
        "></div>
        <!-- Inner marker -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: white;
          "></div>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      </style>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
  });

  return (
    <Marker 
      position={[location.lat, location.lon]}
      icon={currentLocationIcon}
      eventHandlers={{
        click: () => {
          navigate(`/air-quality?lat=${location.lat}&lon=${location.lon}&city=${encodeURIComponent(locationName)}`);
        }
      }}
    >
      <Tooltip direction="top" offset={[0, -30]} opacity={0.95}>
        <div className="font-semibold text-sm">
          {locationName}
          <div className="text-xs font-normal">
            {aqiInfo.category}
          </div>
        </div>
      </Tooltip>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-base">Your Current Location</h3>
          </div>
          <h4 className="font-semibold mb-2">{locationName}</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AQI:</span>
              <Badge variant="outline" className={`${aqiInfo.color} border-current`}>
                {aqi}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category:</span>
              <span className={`text-sm font-semibold ${aqiInfo.color}`}>
                {aqiInfo.category}
              </span>
            </div>
            {data?.weather && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Temperature:</span>
                  <span className="text-sm font-medium">{data.weather.temp}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Humidity:</span>
                  <span className="text-sm font-medium">{data.weather.humidity}%</span>
                </div>
              </>
            )}
            <Button 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate(`/air-quality?lat=${location.lat}&lon=${location.lon}&city=${encodeURIComponent(locationName)}`)}
            >
              View Details
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Individual location marker component
function LocationMarkerOnMap({ location }: { location: LocationData }) {
  const [, navigate] = useLocation();
  
  // Use the AQI value we already have instead of fetching again
  const aqi = location.aqi || 0;
  const aqiInfo = getAQICategory(aqi);

  // Skip rendering if no valid AQI data
  if (aqi <= 0) return null;

  return (
    <Marker 
      position={[location.lat, location.lon]}
      icon={createColoredIcon(aqi)}
      eventHandlers={{
        click: () => {
          navigate(`/air-quality?lat=${location.lat}&lon=${location.lon}&city=${encodeURIComponent(location.name)}`);
        }
      }}
    >
      <Tooltip direction="top" offset={[0, -30]} opacity={0.95}>
        <div className="font-semibold text-sm">
          {location.name}
          <div className="text-xs font-normal">
            AQI: {aqi} - {aqiInfo.category}
          </div>
        </div>
      </Tooltip>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-bold text-base mb-2">{location.name}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AQI:</span>
              <Badge variant="outline" className={`${aqiInfo.color} border-current`}>
                {aqi}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category:</span>
              <span className={`text-sm font-semibold ${aqiInfo.color}`}>
                {aqiInfo.category}
              </span>
            </div>
            <Button 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate(`/air-quality?lat=${location.lat}&lon=${location.lon}&city=${encodeURIComponent(location.name)}`)}
            >
              View Details
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function AQIMap() {
  const { data: savedLocations, isLoading: locationsLoading } = useLocations();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.385, 78.4867]); // Default to Hyderabad
  const [mapZoom, setMapZoom] = useState<number>(6); // Default zoom level
  const [nearbyLocations, setNearbyLocations] = useState<LocationData[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [hasAllCategories, setHasAllCategories] = useState(false);
  const [missingCategories, setMissingCategories] = useState<string[]>([]);

  console.log('🗺️ AQIMap render - currentLocation:', currentLocation, 'nearbyLocations count:', nearbyLocations.length);

  // Fetch nearby stations using WAQI bounds API (fetching ALL stations to show what's available)
  const { data: nearbyAQIData, isLoading: nearbyLoading, error, refetch } = useQuery({
    queryKey: ['nearby-aqi', currentLocation],
    queryFn: async () => {
      if (!currentLocation) {
        console.log('⚠️ No current location set yet');
        return [];
      }

      console.log(`🗺️ Fetching working stations within 100km of (${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)})`);
      const res = await fetch(
        `/api/nearby-stations?lat=${currentLocation.lat}&lon=${currentLocation.lon}&radius=100&filter=all`,
        { signal: AbortSignal.timeout(20000) }
      );
      if (!res.ok) {
        console.error('❌ Failed to fetch nearby stations:', res.status, res.statusText);
        return [];
      }
      const data = await res.json();
      console.log(`✅ Received ${data.length} working stations from API`);
      if (data.length > 0) {
        console.log('📊 Sample stations:', data.slice(0, 5).map((s: any) => ({ name: s.name, aqi: s.aqi })));
        
        // Count by AQI range
        const good = data.filter((s: any) => s.aqi <= 50).length;
        const moderate = data.filter((s: any) => s.aqi > 50 && s.aqi <= 100).length;
        const unhealthy = data.filter((s: any) => s.aqi > 100).length;
        console.log(`📈 AQI Distribution: Good (0-50): ${good}, Moderate (51-100): ${moderate}, Unhealthy (101+): ${unhealthy}`);
      } else {
        console.log('⚠️ No stations found in this area at all');
      }
      return data as Array<{ name: string; lat: number; lon: number; aqi: number }>;
    },
    enabled: !!currentLocation,
    staleTime: 5 * 60 * 1000, // 5 minutes (reduced from 15)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false, // Don't reload when navigating back to map
    refetchOnWindowFocus: false, // Don't reload when switching windows
    refetchInterval: false, // Don't auto-refresh (user can manually refresh)
  });

  useEffect(() => {
    console.log('📍 nearbyAQIData changed:', nearbyAQIData ? `${nearbyAQIData.length} stations` : 'null/undefined');
    if (nearbyAQIData && nearbyAQIData.length > 0) {
      console.log('📍 Processing working stations with AQI data...');
      // Show all stations with valid AQI
      const filtered = (nearbyAQIData as LocationData[]).filter(
        loc => loc.aqi !== undefined && loc.aqi >= 0
      );
      console.log(`✅ ${filtered.length} working stations with AQI data`);
      
      // Check which categories are present
      const categories = {
        good: filtered.some(loc => loc.aqi! <= 50),
        moderate: filtered.some(loc => loc.aqi! > 50 && loc.aqi! <= 100),
        unhealthy: filtered.some(loc => loc.aqi! > 100 && loc.aqi! <= 200),
        severe: filtered.some(loc => loc.aqi! > 200 && loc.aqi! <= 300),
        hazardous: filtered.some(loc => loc.aqi! > 300)
      };
      
      const missing = [];
      if (!categories.good) missing.push('Good (0-50)');
      if (!categories.moderate) missing.push('Moderate (51-100)');
      if (!categories.unhealthy) missing.push('Unhealthy (101-200)');
      if (!categories.severe) missing.push('Severe (201-300)');
      if (!categories.hazardous) missing.push('Hazardous (301+)');
      
      setMissingCategories(missing);
      const allPresent = missing.length === 0;
      setHasAllCategories(allPresent);
      
      console.log('📊 Category check:', {
        good: categories.good,
        moderate: categories.moderate,
        unhealthy: categories.unhealthy,
        severe: categories.severe,
        hazardous: categories.hazardous,
        allPresent,
        missing
      });
      
      // Always show available locations, regardless of category coverage
      console.log(`✨ Displaying ${filtered.length} available locations.`);
      setNearbyLocations(filtered);
    } else {
      console.log('  ⚠️ No stations available, clearing map markers');
      setNearbyLocations([]);
      setHasAllCategories(false);
      setMissingCategories([]);
    }
  }, [nearbyAQIData]);

  useEffect(() => {
    console.log('🗺️ Map component mounted, requesting location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          console.log('✅ Got user location:', coords);
          setCurrentLocation(coords);
          setMapCenter([coords.lat, coords.lon]);
          setMapZoom(7); // Zoom to show ~100km radius
        },
        (error) => {
          console.error('⚠️ Error getting location:', error.message);
          console.log('Using default location (Hyderabad)');
          // Set default location if geolocation fails
          const defaultCoords = { lat: 17.385, lon: 78.4867 };
          setCurrentLocation(defaultCoords);
          setMapCenter([defaultCoords.lat, defaultCoords.lon]);
        }
      );
    } else {
      console.log('⚠️ Geolocation not supported, using default location');
      const defaultCoords = { lat: 17.385, lon: 78.4867 };
      setCurrentLocation(defaultCoords);
      setMapCenter([defaultCoords.lat, defaultCoords.lon]);
    }
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        console.log('📍 Got user location:', coords);
        setCurrentLocation(coords);
        setMapCenter([coords.lat, coords.lon]);
        setMapZoom(10); // Zoom closer for hyperlocal view
        setIsLocating(false);
        // Force refetch of nearby stations
        setTimeout(() => refetch(), 100);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            alert('Please allow location access to use this feature');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable');
            break;
          case error.TIMEOUT:
            alert('Location request timed out');
            break;
          default:
            alert('An error occurred while getting your location');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Back to Home Button */}
      <Link href="/">
        <Button variant="ghost" className="mb-4 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Interactive AQI Map</h1>
        <p className="text-muted-foreground">
          Explore hyperlocal air quality around your location. Shows all AQI monitoring stations within 100km with category distribution.
        </p>
      </div>

      {/* Legend and Controls */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold">AQI Legend:</span>
              <Badge variant="outline" className="text-green-700 border-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Good (0-50)
              </Badge>
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                Moderate (51-100)
              </Badge>
              <Badge variant="outline" className="text-orange-700 border-orange-300">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                Unhealthy (Sensitive) (101-150)
              </Badge>
              <Badge variant="outline" className="text-red-700 border-red-300">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                Unhealthy (151-200)
              </Badge>
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                <div className="w-2 h-2 bg-purple-600 rounded-full mr-2" />
                Severe (201-300)
              </Badge>
              <Badge variant="outline" className="text-rose-900 border-rose-300">
                <div className="w-2 h-2 bg-rose-900 rounded-full mr-2" />
                Hazardous (301+)
              </Badge>
            </div>
            <div className="flex gap-2 items-center">
              {nearbyLocations.length > 0 && (
                <Badge className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2">
                  {nearbyLocations.length} stations found
                </Badge>
              )}
              {hasAllCategories && nearbyLocations.length > 0 && (
                <Badge className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2">
                  ✓ All 5 categories present
                </Badge>
              )}
              {!hasAllCategories && missingCategories.length > 0 && nearbyLocations.length > 0 && (
                <Badge className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-4 py-2" title={`Missing: ${missingCategories.join(', ')}`}>
                  {5 - missingCategories.length}/5 categories
                </Badge>
              )}
              <Button 
                onClick={handleLocateMe} 
                size="sm" 
                variant="outline"
                disabled={isLocating}
              >
                <Locate className={`w-4 h-4 mr-2 ${isLocating ? 'animate-spin' : ''}`} />
                {isLocating ? 'Locating...' : 'Locate Me/Hyperlocal area'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {!currentLocation ? (
            <div className="h-[600px] flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground">Getting your location...</p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 px-4 py-2 rounded-lg shadow-md">
                  <p className="text-sm text-red-800">Error loading AQI data. Please try again.</p>
                </div>
              )}
              {nearbyLoading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-800 font-medium">Searching for AQI stations within 100km...</p>
                  </div>
                </div>
              )}
              {!nearbyLoading && nearbyLocations.length === 0 && nearbyAQIData && nearbyAQIData.length === 0 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg shadow-md">
                  <p className="text-sm text-yellow-800 font-medium">No working AQI stations found within 100km. Try a different location.</p>
                </div>
              )}
              {!nearbyLoading && (!nearbyAQIData || (Array.isArray(nearbyAQIData) && nearbyAQIData.length === 0)) && error && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 px-4 py-2 rounded-lg shadow-md">
                  <p className="text-sm text-red-800 font-medium">Failed to fetch AQI data. Please check your connection and try again.</p>
                </div>
              )}
              <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '600px', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} zoom={mapZoom} />
              
              {/* Current Location Marker */}
              {currentLocation && (
                <CurrentLocationMarker location={currentLocation} />
              )}

              {/* Nearby Locations with Good/Moderate AQI */}
              {nearbyLocations?.map((location, index) => (
                <LocationMarkerOnMap key={`nearby-${index}`} location={location} />
              ))}
            </MapContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">How to use the map</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>The map shows <strong>all AQI monitoring stations within 100km</strong> of your current location</li>
                <li>Each marker shows the AQI value and is color-coded by category (Good, Moderate, Unhealthy, Severe, Hazardous)</li>
                <li>Category badges show which AQI levels are present in your area</li>
                <li>Click on any marker to see detailed air quality information for that location</li>
                <li>Use the "Locate Me/Hyperlocal area" button to refresh your location and reload nearby stations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
