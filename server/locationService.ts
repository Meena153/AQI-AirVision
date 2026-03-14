/**
 * Location Service - Multi-provider geocoding service
 * Supports: Nominatim (OSM), OpenWeatherMap, Google Geocoding, Mapbox
 */

// Track which API warnings have been shown (to avoid spam)
const shownApiWarnings = new Set<string>();

export type LocationProvider = 'nominatim' | 'openweather' | 'google' | 'mapbox';

export interface LocationResult {
  lat: number;
  lon: number;
  name: string;
  displayName?: string;
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    country?: string;
  };
}

interface ProviderConfig {
  name: string;
  requiresApiKey: boolean;
  envVarName?: string;
}

const PROVIDER_CONFIGS: Record<LocationProvider, ProviderConfig> = {
  nominatim: {
    name: 'OpenStreetMap Nominatim',
    requiresApiKey: false,
  },
  openweather: {
    name: 'OpenWeatherMap',
    requiresApiKey: true,
    envVarName: 'OPENWEATHERMAP_API_KEY',
  },
  google: {
    name: 'Google Geocoding API',
    requiresApiKey: true,
    envVarName: 'GOOGLE_GEOCODING_API_KEY',
  },
  mapbox: {
    name: 'Mapbox Geocoding API',
    requiresApiKey: true,
    envVarName: 'MAPBOX_API_KEY',
  },
};

/**
 * Geocode using OpenStreetMap Nominatim (Free, no API key required)
 */
async function geocodeWithNominatim(searchTerm: string): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    // Add countrycodes parameter if searching for Indian locations
    const isIndianSearch = searchTerm.toLowerCase().includes('india') || /,\s*in\s*$/i.test(searchTerm);
    const countryParam = isIndianSearch ? '&countrycodes=in' : '';
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=1&addressdetails=1${countryParam}`,
      { headers: { 'User-Agent': 'AirVision-App/1.0' }, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    const addr = result.address || {};

    // Build hyperlocal name
    const nameParts = [];
    if (addr.road || addr.neighbourhood || addr.suburb) {
      nameParts.push(addr.road || addr.neighbourhood || addr.suburb);
    }
    if (addr.city || addr.town) {
      nameParts.push(addr.city || addr.town);
    } else if (addr.state) {
      nameParts.push(addr.state);
    }

    const localName = nameParts.length > 0
      ? nameParts.join(', ')
      : result.display_name.split(',').slice(0, 2).join(',');

    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: localName,
      displayName: result.display_name,
      address: addr,
    };
  } catch (error) {
    // If timeout or abort, fallback to OpenWeatherMap geocoding
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT') || errorMsg.includes('aborted')) {
      console.log(`⚠️  Nominatim temporarily unavailable (timeout/abort), falling back to OpenWeatherMap`);
      // Try OpenWeatherMap as fallback
      try {
        return await geocodeWithOpenWeather(searchTerm);
      } catch (fallbackError) {
        console.log(`⚠️  OpenWeatherMap geocoding also failed: ${fallbackError}`);
      }
    } else {
      console.log(`⚠️  Nominatim geocoding failed: ${errorMsg}`);
    }
    return null;
  }
}

/**
 * Geocode using OpenWeatherMap (Requires API key)
 */
async function geocodeWithOpenWeather(searchTerm: string): Promise<LocationResult | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.warn('OpenWeatherMap API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchTerm)}&limit=1&appid=${apiKey}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      lat: result.lat,
      lon: result.lon,
      name: `${result.name}${result.state ? ', ' + result.state : ''}`,
      displayName: `${result.name}, ${result.country}`,
      address: {
        city: result.name,
        state: result.state,
        country: result.country,
      },
    };
  } catch (error) {
    console.error('OpenWeatherMap geocoding error:', error);
    return null;
  }
}

/**
 * Geocode using Google Geocoding API (Requires API key)
 */
async function geocodeWithGoogle(searchTerm: string): Promise<LocationResult | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    console.warn('Google Geocoding API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchTerm)}&key=${apiKey}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract address components
    const addressComponents = result.address_components || [];
    const address: LocationResult['address'] = {};

    addressComponents.forEach((component: any) => {
      if (component.types.includes('route')) address.road = component.long_name;
      if (component.types.includes('neighborhood')) address.neighbourhood = component.long_name;
      if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1'))
        address.suburb = component.long_name;
      if (component.types.includes('locality')) address.city = component.long_name;
      if (component.types.includes('administrative_area_level_1')) address.state = component.long_name;
      if (component.types.includes('country')) address.country = component.long_name;
    });

    // Build name from address components
    const nameParts = [];
    if (address.neighbourhood || address.suburb) {
      nameParts.push(address.neighbourhood || address.suburb);
    }
    if (address.city) {
      nameParts.push(address.city);
    }

    return {
      lat: location.lat,
      lon: location.lng,
      name: nameParts.join(', ') || result.formatted_address.split(',')[0],
      displayName: result.formatted_address,
      address,
    };
  } catch (error) {
    console.error('Google Geocoding error:', error);
    return null;
  }
}

/**
 * Geocode using Mapbox Geocoding API (Requires API key)
 */
async function geocodeWithMapbox(searchTerm: string): Promise<LocationResult | null> {
  const apiKey = process.env.MAPBOX_API_KEY;
  if (!apiKey) {
    console.warn('Mapbox API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json?access_token=${apiKey}&limit=1`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const result = data.features[0];
    const [lon, lat] = result.center;

    // Extract context (address components)
    const context = result.context || [];
    const address: LocationResult['address'] = {};

    context.forEach((item: any) => {
      if (item.id.startsWith('neighborhood')) address.neighbourhood = item.text;
      if (item.id.startsWith('locality') || item.id.startsWith('place')) address.city = item.text;
      if (item.id.startsWith('region')) address.state = item.text;
      if (item.id.startsWith('country')) address.country = item.text;
    });

    return {
      lat,
      lon,
      name: result.text,
      displayName: result.place_name,
      address,
    };
  } catch (error) {
    console.error('Mapbox geocoding error:', error);
    return null;
  }
}

/**
 * Clean and normalize location names for better geocoding
 */
function cleanLocationName(location: string): string {
  let cleaned = location.trim();
  
  // Remove airport/station suffixes
  cleaned = cleaned.replace(/\s*-\s*(Intl\.|International|Domestic)?\s*(Airport|Station|Railway|Terminal).*$/i, '');
  cleaned = cleaned.replace(/\s*\(\s*(Airport|Station|Railway|Terminal).*\)$/i, '');
  
  return cleaned.trim();
}

/**
 * Extract base city name from complex location strings
 */
function extractBaseCityName(location: string): string | null {
  // For "City - Airport Name", extract just "City"
  const dashMatch = location.match(/^([^-]+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  return null;
}

/**
 * Get spelling variations and alternatives for Indian locations
 */
function getLocationVariations(location: string): string[] {
  const variations: string[] = [location];
  const lower = location.toLowerCase();
  
  // Handle compound names with "and" - try first part only
  if (lower.includes(' and ')) {
    const firstPart = location.split(/\s+and\s+/i)[0].trim();
    if (firstPart) {
      variations.push(firstPart);
    }
  }
  
  // Spelling variations
  const spellingMap: Record<string, string[]> = {
    'himayathnagar': ['Himayatnagar', 'Himayat Nagar'],
    'himayatnagar': ['Himayathnagar', 'Himayat Nagar'],
    'bengaluru': ['Bangalore'],
    'bangalore': ['Bengaluru'],
    'kolkata': ['Calcutta'],
    'calcutta': ['Kolkata'],
    'mumbai': ['Bombay'],
    'bombay': ['Mumbai'],
    'chennai': ['Madras'],
    'madras': ['Chennai'],
  };
  
  for (const [key, alts] of Object.entries(spellingMap)) {
    if (lower.includes(key)) {
      alts.forEach(alt => {
        variations.push(location.replace(new RegExp(key, 'gi'), alt));
      });
    }
  }
  
  return variations;
}

/**
 * Main geocoding function - uses specified provider or falls back to others
 */
export async function geocodeLocation(
  city: string,
  preferredProvider: LocationProvider = 'nominatim',
  useFallback: boolean = true
): Promise<LocationResult> {
  console.log(`\n🔍 Geocoding "${city}" with provider: ${preferredProvider}`);

  // Clean location name first
  const cleanedCity = cleanLocationName(city);
  
  // Extract fallback search terms
  const searchTerms: string[] = [];
  const parts = cleanedCity.split(',').map(p => p.trim());

  // Add cleaned version and its variations
  getLocationVariations(cleanedCity).forEach(v => searchTerms.push(v));
  
  // For airport/complex names, add base city name
  const baseCityName = extractBaseCityName(city);
  if (baseCityName && baseCityName !== cleanedCity) {
    getLocationVariations(baseCityName).forEach(v => searchTerms.push(v));
  }
  
  if (parts.length > 1) {
    searchTerms.push(parts.slice(1).join(', '));
    if (parts.length > 2) {
      searchTerms.push(parts.slice(2).join(', '));
    }
  }

  // For Indian locations, add ", India" suffix if not present
  const indianKeywords = [
    'pradesh', 'maharashtra', 'karnataka', 'tamil nadu', 'kerala', 'bengal', 
    'bihar', 'delhi', 'mumbai', 'chennai', 'bangalore', 'bengaluru', 'hyderabad', 
    'kolkata', 'calcutta', 'telangana', 'meghalaya', 'himayathnagar', 'himayatnagar',
    'jammu', 'kashmir', 'punjab', 'haryana', 'rajasthan', 'goa', 'gujarat',
    'assam', 'manipur', 'mizoram', 'nagaland', 'sikkim', 'tripura', 'uttarakhand',
    'chandigarh', 'puducherry', 'pondicherry'
  ];
  const isLikelyIndian = indianKeywords.some(keyword => cleanedCity.toLowerCase().includes(keyword.toLowerCase()));
  const hasCountry = /,\s*(india|in)\s*$/i.test(cleanedCity);
  
  if (isLikelyIndian && !hasCountry) {
    // Add ", India" to all search terms
    const indiaTerms: string[] = [];
    searchTerms.forEach(term => {
      if (!/,\s*(india|in)\s*$/i.test(term)) {
        indiaTerms.push(`${term}, India`);
      }
    });
    searchTerms.push(...indiaTerms);
    
    // Add just first part with India
    if (parts.length > 0) {
      searchTerms.push(`${parts[0]}, India`);
    }
  }

  // Deduplicate search terms (case-insensitive)
  const uniqueTerms = Array.from(new Set(searchTerms.map(t => t.toLowerCase())))
    .map(lower => searchTerms.find(t => t.toLowerCase() === lower)!);

  const providers: LocationProvider[] = useFallback
    ? [preferredProvider, ...Object.keys(PROVIDER_CONFIGS).filter(p => p !== preferredProvider) as LocationProvider[]]
    : [preferredProvider];

  // Provider function mapping
  const providerFunctions: Record<LocationProvider, (term: string) => Promise<LocationResult | null>> = {
    nominatim: geocodeWithNominatim,
    openweather: geocodeWithOpenWeather,
    google: geocodeWithGoogle,
    mapbox: geocodeWithMapbox,
  };

  // Try each provider with each search term
  for (const provider of providers) {
    const config = PROVIDER_CONFIGS[provider];
    
    // Skip if API key is required but not configured
    if (config.requiresApiKey && config.envVarName && !process.env[config.envVarName]) {
      // Only show warning once per provider per session
      if (!shownApiWarnings.has(provider)) {
        console.log(`⚠️  Skipping ${config.name} - API key not configured`);
        shownApiWarnings.add(provider);
      }
      continue;
    }

    for (const searchTerm of uniqueTerms) {
      console.log(`Trying ${config.name} with: "${searchTerm}"`);
      
      const result = await providerFunctions[provider](searchTerm);
      
      if (result) {
        console.log(`✓ Success with ${config.name}: ${result.name} (${result.lat}, ${result.lon})`);
        return result;
      }

      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`✗ All geocoding attempts failed for "${city}"`);
  throw new Error(`Location not found: "${city}". Try searching with state/province, country, or a nearby major city (e.g., "City, State" or "City, Country").`);
}

/**
 * Check if a provider is available (API key configured if required)
 */
export function isProviderAvailable(provider: LocationProvider): boolean {
  const config = PROVIDER_CONFIGS[provider];
  if (!config.requiresApiKey) return true;
  if (!config.envVarName) return false;
  return !!process.env[config.envVarName];
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): { provider: LocationProvider; name: string; available: boolean }[] {
  return Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
    provider: key as LocationProvider,
    name: config.name,
    available: isProviderAvailable(key as LocationProvider),
  }));
}
