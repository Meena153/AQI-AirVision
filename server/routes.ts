import type { Express } from "express";
import type { Server } from "http";
import { storage, saveAQIHistory } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { geocodeLocation, type LocationProvider, getAvailableProviders } from "./locationService";
import { fetchAQIData, calculateUsAQI } from "./indianAqiService";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

// Enhanced geocoding with user-preferred location API provider
async function fetchGeocoding(city: string, userId?: string) {
  console.log(`\n🔍 Geocoding search for: "${city}"`);
  
  // Get user's preferred location provider
  let preferredProvider: LocationProvider = 'nominatim'; // default
  
  if (userId) {
    try {
      const user = await storage.getUser(userId);
      // User preferences not yet implemented, using default
      // if (user?.locationApiProvider) {
      //   preferredProvider = user.locationApiProvider as LocationProvider;
      //   console.log(`Using user's preferred provider: ${preferredProvider}`);
      // }
    } catch (err) {
      console.log('Could not fetch user preferences, using default provider');
    }
  }
  
  // Use the new location service
  const result = await geocodeLocation(city, preferredProvider, true);
  
  return {
    lat: result.lat,
    lon: result.lon,
    name: result.name,
  };
}

// Fetch weather and air quality data
async function fetchAirQualityAndWeather(lat: number, lon: number, cityName?: string, displayNameOverride?: string) {
  // Fetch weather data from Open-Meteo
  let weatherData: any;
  try {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=ms&timezone=auto`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!weatherRes.ok) {
      throw new Error(`Weather API returned status ${weatherRes.status}`);
    }
    
    weatherData = await weatherRes.json();
    
    if (!weatherData.current) {
      throw new Error("Weather data not available");
    }
  } catch (err) {
    console.error("Weather fetch error:", err);
    throw new Error(`Failed to fetch weather data for coordinates ${lat}, ${lon}`);
  }

  // Fetch AQI data using the new Indian AQI service
  // Pass real cityName for proper WAQI lookup; grid-nearby points pass undefined so WAQI uses geo:lat;lon
  const aqiData = await fetchAQIData(lat, lon, cityName);

  console.log(`\n📊 Final Air Quality Data for ${cityName || displayNameOverride || 'location'}:`);
  console.log(`  ✅ Data Source: ${aqiData.dataSource}`);
  console.log(`  📈 AQI: ${aqiData.aqi}`);
  console.log(`  🎯 Dominant Pollutant: ${aqiData.dominantPollutant.toUpperCase()}`);
  if (aqiData.stationName) console.log(`  🏢 Station: ${aqiData.stationName}`);

  // Get hyperlocal location name with detailed address
  // If a displayNameOverride is given (e.g. "5.2km NE" from grid search), skip reverse geocoding
  let locationName = displayNameOverride || cityName || "Unknown Location";
  let fullAddress = "";
  let neighborhood = "";
  let suburb = "";
  let district = "";
  
  if (!displayNameOverride && !cityName) {
    // First, try to match known area coordinates for instant results
    const knownAreas = [
      {
        name: "Almasguda, Telangana",
        lat: { min: 17.18, max: 17.28 },
        lon: { min: 78.46, max: 78.56 }
      },
      {
        name: "Meerpet, Hyderabad, Telangana",
        lat: { min: 17.28, max: 17.38 },
        lon: { min: 78.53, max: 78.63 }
      }
    ];
    
    const matchedArea = knownAreas.find(
      area => lat >= area.lat.min && lat <= area.lat.max && 
              lon >= area.lon.min && lon <= area.lon.max
    );
    
    if (matchedArea) {
      locationName = matchedArea.name;
      fullAddress = matchedArea.name;
      console.log(`\n📍 Matched known area: ${locationName}\n`);
    } else {
      // Try reverse geocoding for unknown areas
      try {
        // Strategy: Query multiple zoom levels and combine results for best accuracy
        const results: any[] = [];
        
        // Zoom 16 = street/neighborhood level (most specific)
        // Zoom 14 = suburb/locality level (better for area boundaries)
        // Zoom 12 = district level (fallback)
        for (const zoom of [16, 14, 12]) {
          const nominatimRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=${zoom}&addressdetails=1`,
          { 
            headers: { 'User-Agent': 'AirVision-App/1.0' },
            signal: AbortSignal.timeout(8000) // Increase timeout to 8 seconds
          }
        );
        
        if (nominatimRes.ok) {
          const data = await nominatimRes.json();
          results.push({ zoom, data, addr: data.address || {} });
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      if (results.length > 0) {
        // Analyze all results to find the best locality name
        let bestLocalArea = null;
        let bestCity = null;
        let bestState = null;
        
        console.log("\\n=== Location Detection Results ===");
        
        for (const { zoom, addr } of results) {
          console.log(`\\nZoom ${zoom}:`);
          console.log(`  suburb: ${addr.suburb || 'N/A'}`);
          console.log(`  neighbourhood: ${addr.neighbourhood || 'N/A'}`);
          console.log(`  residential: ${addr.residential || 'N/A'}`);
          console.log(`  city_district: ${addr.city_district || 'N/A'}`);
          console.log(`  city: ${addr.city || 'N/A'}`);
          
          // Extract best suburb/locality (prefer from zoom 14-16)
          if (!bestLocalArea && zoom >= 14) {
            // Priority: suburb > neighbourhood > residential
            // But skip if it contains "mandal" (administrative boundary)
            const candidates = [
              addr.suburb,
              addr.neighbourhood, 
              addr.residential,
              addr.hamlet,
              addr.quarter
            ];
            
            for (const candidate of candidates) {
              if (candidate && 
                  !candidate.toLowerCase().includes('mandal') &&
                  candidate.length > 2) {
                bestLocalArea = candidate;
                console.log(`  ✓ Selected: ${candidate}`);
                break;
              }
            }
          }
          
          // Get city name (prefer from any zoom level)
          if (!bestCity) {
            bestCity = addr.city || addr.town || addr.municipality;
          }
          
          // Get state
          if (!bestState) {
            bestState = addr.state;
          }
        }
        
        // Fallback to broader area if no specific locality found
        if (!bestLocalArea) {
          for (const { addr } of results) {
            bestLocalArea = addr.city_district || addr.county || addr.state_district;
            if (bestLocalArea && !bestLocalArea.toLowerCase().includes('mandal')) {
              console.log(`  ⚠ Using fallback: ${bestLocalArea}`);
              break;
            }
          }
        }
        
        // Construct location name (similar to IndiaAQI format)
        const parts = [];
        if (bestLocalArea) {
          parts.push(bestLocalArea);
          neighborhood = bestLocalArea;
          suburb = bestLocalArea;
        }
        
        if (bestCity && !parts.includes(bestCity)) {
          parts.push(bestCity);
        }
        
        if (bestState && !parts.includes(bestState)) {
          parts.push(bestState);
        }
        
        const firstResult = results[0];
        district = firstResult.addr.state_district || firstResult.addr.county || "";
        locationName = parts.join(', ') || "Unknown Location";
        fullAddress = firstResult.data.display_name || locationName;
        
        console.log(`\n📍 FINAL LOCATION: ${locationName}`);
        console.log(`   Full Address: ${fullAddress}\n`);
      } else {
        console.log("⚠️  No reverse geocoding results returned");
      }
    } catch (err) {
      // Log detailed error for debugging
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(`⚠️  Reverse geocoding failed: ${errorMsg}`);
      console.log(`   Coordinates: ${lat}, ${lon}`);
      console.log(`   Using default location name`);
    }
    } // End of else block for reverse geocoding
  }

  return {
    location: locationName,
    fullAddress: fullAddress || locationName,
    neighborhood: neighborhood,
    district: district,
    lat,
    lon,
    weather: {
      temp: weatherData.current.temperature_2m,
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: weatherData.current.wind_speed_10m,
      condition: decodeWeatherCode(weatherData.current.weather_code),
      icon: "cloud",
    },
    airQuality: {
      aqi: aqiData.aqi,
      city: locationName,
      dominentpol: aqiData.dominantPollutant,
      dataSource: aqiData.dataSource,
      stationName: aqiData.stationName || undefined,
      stationUrl: aqiData.stationUrl || undefined,
      iaqi: aqiData.pollutants,
      forecast: {
        daily: {
          aqi: aqiData.hourlyForecast || [],
        },
      },
    },
  };
}

function decodeWeatherCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code < 3) return "Partly cloudy";
  if (code < 50) return "Foggy";
  if (code < 80) return "Rainy";
  return "Stormy";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Setup session middleware
  const pgStore = connectPg(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: true,
      ttl: 7 * 24 * 60 * 60 * 1000,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));

  const requireAuth = (req: any, res: any, next: any) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.userId = userId;
    next();
  };

  // Auth routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const validated = api.auth.register.input.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists. Please login." });
      }

      const passwordHash = await bcrypt.hash(validated.password, 10);
      
      const user = await storage.createUser({
        id: crypto.randomUUID(),
        name: validated.name,
        email: validated.email,
        passwordHash,
      });

      (req.session as any).userId = user.id;

      res.status(201).json({ id: user.id, name: user.name });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path[0] });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed" });
      }
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const validated = api.auth.login.input.parse(req.body);
      
      const user = await storage.getUserByEmail(validated.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(validated.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;

      res.json({ id: user.id, name: user.name });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path[0] });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.json(null);
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.json(null);
      }

      res.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update user settings (location API provider)
  app.patch(api.auth.updateSettings.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { locationApiProvider } = api.auth.updateSettings.input.parse(req.body);

      if (locationApiProvider) {
        await storage.updateUserSettings(userId, { locationApiProvider });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "Settings updated successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get available location providers
  app.get(api.auth.availableProviders.path, async (req, res) => {
    try {
      const providers = getAvailableProviders();
      res.json(providers);
    } catch (error) {
      console.error("Get providers error:", error);
      res.status(500).json({ message: "Failed to get providers" });
    }
  });

  app.post(api.auth.logout.path, async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Saved Locations Routes
  app.get(api.locations.list.path, requireAuth, async (req, res) => {
    try {
      const locations = await storage.getSavedLocations(req.userId);
      res.json(locations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch saved locations" });
    }
  });

  app.post(api.locations.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.locations.create.input.parse(req.body);
      const location = await storage.createSavedLocation({
        ...input,
        userId: req.userId
      });
      res.status(201).json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.locations.delete.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteSavedLocation(id, req.userId);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  app.delete(api.locations.deleteAll.path, requireAuth, async (req, res) => {
    try {
      await storage.deleteAllSavedLocations(req.userId);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete all locations" });
    }
  });

  // Weather & AQI Route
  app.get(api.weather.get.path, async (req, res) => {
    try {
      let { lat, lon, city, name } = req.query;
      
      console.log(`\n🌍 Weather API Request: lat=${lat}, lon=${lon}, city=${city}, name=${name}`);

      // Only geocode city if coordinates are NOT provided
      // This ensures saved locations with exact coordinates use those coordinates
      if (city && (!lat || !lon)) {
        try {
          const coords = await fetchGeocoding(String(city), (req.session as any)?.userId);
          lat = String(coords.lat);
          lon = String(coords.lon);
          console.log(`  ✅ Geocoded "${city}" to: ${lat}, ${lon}`);
        } catch (err) {
          console.error(`  ❌ Geocoding failed for city: ${city}`, err);
          return res.status(404).json({ message: `Could not find location: ${city}` });
        }
      } else if (lat && lon) {
        console.log(`  📍 Using provided coordinates: ${lat}, ${lon}`);
      }

      if (!lat || !lon) {
        console.error(`  ❌ Missing coordinates`);
        return res.status(400).json({ message: "Latitude/Longitude or City required" });
      }

      const displayName = (name as string) || (city as string) || undefined;
      
      // Allow city/name to be used for AQI lookup even if coordinates are provided
      // This ensures we get the official station for major cities ("Hyderabad" -> Zoo Park)
      // instead of the nearest random station to the coordinates, providing consistency.
      const aqiLookupName = (city as string) || undefined;
      
      console.log(`  Fetching air quality and weather data...`);
      console.log(`  AQI lookup strategy: ${aqiLookupName ? `city-based (${aqiLookupName})` : 'geo-based (coordinates only)'}`);
      
      try {
        const data = await fetchAirQualityAndWeather(Number(lat), Number(lon), aqiLookupName, displayName);
        console.log(`  ✅ Successfully returned data for: ${data.location}\n`);
        
        // Save AQI History if locationId is provided
        const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
        if (locationId && !isNaN(locationId)) {
          try {
            await saveAQIHistory({
              locationId,
              recordedAt: new Date(),
              aqi: data.airQuality.aqi,
              pm2_5: data.airQuality.iaqi?.pm25?.v,
              pm10: data.airQuality.iaqi?.pm10?.v,
              co: data.airQuality.iaqi?.co?.v,
              no2: data.airQuality.iaqi?.no2?.v,
              so2: data.airQuality.iaqi?.so2?.v,
              o3: data.airQuality.iaqi?.o3?.v,
            });
            console.log(`  ✅ Saved AQI history for location ${locationId}`);
          } catch (historyErr) {
            console.error("Failed to save AQI history:", historyErr);
          }
        }
        
        res.json(data);
      } catch (err) {
        console.error(`  ❌ Error fetching air quality and weather for ${lat}, ${lon}:`, err);
        // Return a proper error response instead of 500
        return res.status(404).json({ 
          message: "Could not fetch air quality data for this location. The location may not have nearby monitoring stations." 
        });
      }
    } catch (err) {
      console.error("❌ Weather route error:", err);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  // Nearby AQI Stations - uses WAQI search API to find working stations
  app.get("/api/nearby-stations", async (req, res) => {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      const radiusKm = Number(req.query.radius || 100);
      const filter = (req.query.filter as string) || 'good-moderate'; // 'all', 'good-moderate'

      if (!lat || !lon) {
        return res.status(400).json({ message: "lat and lon are required" });
      }

      const waqiApiKey = process.env.WAQI_API_KEY;
      if (!waqiApiKey) {
        return res.status(500).json({ message: "WAQI API key not configured" });
      }

      console.log(`\n🗺️  Searching for working AQI stations within ${radiusKm}km of (${lat.toFixed(4)},${lon.toFixed(4)})`);

      // Determine search keywords based on location (approximate)
      let searchKeywords = ['india', 'hyderabad', 'telangana', 'delhi', 'mumbai', 'bangalore'];
      
      // Search for nearby major cities based on coordinates
      if (lat >= 17 && lat <= 18 && lon >= 78 && lon <= 79) {
        searchKeywords = ['hyderabad', 'telangana'];
      } else if (lat >= 28 && lat <= 29 && lon >= 77 && lon <= 78) {
        searchKeywords = ['delhi', 'new delhi', 'noida', 'gurgaon'];
      } else if (lat >= 19 && lat <= 20 && lon >= 72 && lon <= 73) {
        searchKeywords = ['mumbai', 'maharashtra'];
      } else if (lat >= 12 && lat <= 13 && lon >= 77 && lon <= 78) {
        searchKeywords = ['bangalore', 'bengaluru'];
      }

      console.log(`  Search keywords: ${searchKeywords.join(', ')}`);

      // Fetch stations for each keyword
      const allStations: any[] = [];
      
      for (const keyword of searchKeywords) {
        try {
          const searchUrl = `https://api.waqi.info/search/?token=${waqiApiKey}&keyword=${encodeURIComponent(keyword)}`;
          const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
          const searchData = await searchRes.json();
          
          if (searchData && searchData.status === 'ok' && searchData.data && searchData.data.length > 0) {
            console.log(`  Found ${searchData.data.length} stations for "${keyword}"`);
            
            // Filter and process stations
            for (const station of searchData.data) {
              if (!station.aqi || station.aqi === '-') continue;
              
              const aqiNum = typeof station.aqi === 'number' ? station.aqi : Number(station.aqi);
              if (isNaN(aqiNum) || aqiNum < 0 || aqiNum > 500) continue;
              
              // Extract coordinates
              if (!station.station?.geo || station.station.geo.length !== 2) continue;
              
              const stationLat = station.station.geo[0];
              const stationLon = station.station.geo[1];
              
              // Calculate distance
              const R = 6371; // Earth's radius in km
              const dLat = ((stationLat - lat) * Math.PI) / 180;
              const dLon = ((stationLon - lon) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((lat * Math.PI) / 180) *
                Math.cos((stationLat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;
              
              if (distance <= radiusKm) {
                allStations.push({
                  name: station.station.name,
                  lat: stationLat,
                  lon: stationLon,
                  aqi: aqiNum,
                  uid: station.uid,
                  distance,
                });
              }
            }
          }
        } catch (err) {
          console.log(`  ⚠️  Search failed for "${keyword}"`);
        }
      }

      console.log(`  Found ${allStations.length} total working stations`);

      // Remove duplicates by UID
      const uniqueStations = Array.from(
        new Map(allStations.map(s => [s.uid, s])).values()
      );

      console.log(`  ${uniqueStations.length} unique stations after deduplication`);

      // Apply AQI filter
      const filtered = uniqueStations.filter((s) => {
        if (filter === 'all') {
          return true;
        } else {
          // good-moderate: 0-100
          return s.aqi >= 0 && s.aqi <= 100;
        }
      });

      console.log(`  ✅ ${filtered.length} stations match filter criteria`);
      if (filtered.length > 0) {
        console.log(`  Sample stations:`, filtered.slice(0, 3).map(s => ({ name: s.name, aqi: s.aqi, distance: s.distance.toFixed(1) + 'km' })));
      }

      res.json(filtered.map(s => ({
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        aqi: s.aqi
      })));
    } catch (err) {
      console.error('Nearby stations error:', err);
      res.json([]);
    }
  });

  // Python forecast  
  app.get("/api/forecast", async (req, res) => {
    try {
      const hours = Number(req.query.hours ?? 72);
      const model = String(req.query.model ?? "prophet");
      const lat = req.query.lat ? Number(req.query.lat) : undefined;
      const lon = req.query.lon ? Number(req.query.lon) : undefined;
      const predictPast = req.query.predict_past === "true";
      const predictCurrent = req.query.predict_current === "true";

      const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
      let url = `${ML_URL}/forecast/${model}?hours=${hours}&predict_past=${predictPast}&predict_current=${predictCurrent}`;
      if (lat !== undefined && lon !== undefined) {
        url += `&lat=${lat}&lon=${lon}`;
      }

      const mlResp = await fetch(url);
      
      if (!mlResp.ok) {
        const errorData = await mlResp.json();
        return res.status(mlResp.status).json(errorData);
      }
      
      const data = await mlResp.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Forecast error:", err?.message);
      return res.status(500).json({
        message: "Forecast failed",
        details: err?.message,
      });
    }
  });

  // Historical AQI Data - Fetch from Open-Meteo Air Quality API
  app.get("/api/historical-aqi", async (req, res) => {
    try {
      const { lat, lon, timeRange, startDate, endDate, custom } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const latNum = Number(lat);
      const lonNum = Number(lon);

      let start: string;
      let end: string;
      let useDaily = false;

      // Handle custom date range
      if (custom === "true" && startDate && endDate) {
        start = String(startDate);
        end = String(endDate);
        
        // Calculate days difference to determine granularity
        const daysDiff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
        useDaily = daysDiff > 30; // Use daily if more than 30 days
      } else {
        // Use preset time range
        if (!timeRange) {
          return res.status(400).json({ message: "Time range is required" });
        }

        // Calculate date range based on time range
        const endDate = new Date();
        const startDate = new Date();
        
        if (timeRange === "24hrs") {
          startDate.setDate(startDate.getDate() - 1);
        } else if (timeRange === "7days") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeRange === "30days") {
          startDate.setDate(startDate.getDate() - 30);
        } else if (timeRange === "6months") {
          startDate.setMonth(startDate.getMonth() - 6);
          useDaily = true;
        } else if (timeRange === "1year") {
          startDate.setFullYear(startDate.getFullYear() - 1);
          useDaily = true;
        } else if (timeRange === "2years") {
          startDate.setFullYear(startDate.getFullYear() - 2);
          useDaily = true;
        }

        // Format dates for Open-Meteo API (YYYY-MM-DD)
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        start = formatDate(startDate);
        end = formatDate(endDate);
      }

      // Determine granularity
      const granularity = useDaily ? "daily" : "hourly";

      // Fetch historical air quality data from Open-Meteo
      const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?` +
        `latitude=${latNum}&longitude=${lonNum}` +
        `&${granularity}=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi` +
        `&start_date=${start}&end_date=${end}` +
        `&timezone=auto`;

      console.log(`📊 Fetching historical AQI (${granularity}) from Open-Meteo: ${start} to ${end}`);
      
      const response = await fetch(openMeteoUrl);
      
      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.statusText}`);
      }

      const apiData = await response.json();

      const dataKey = useDaily ? apiData.daily : apiData.hourly;
      
      if (!dataKey || !dataKey.time) {
        return res.json({
          lat: latNum,
          lon: lonNum,
          timeRange,
          data: [],
          count: 0,
          source: "Open-Meteo",
        });
      }

      // Convert API data to our format using Indian AQI
      let historicalData = dataKey.time.map((time: string, index: number) => {
        const pm25 = dataKey.pm2_5?.[index] || 0;
        const pm10 = dataKey.pm10?.[index] || 0;
        const o3 = dataKey.ozone?.[index] || 0;
        const no2 = dataKey.nitrogen_dioxide?.[index] || 0;
        const so2 = dataKey.sulphur_dioxide?.[index] || 0;
        const co = dataKey.carbon_monoxide?.[index] || 0;
        
        // Calculate US AQI
        const aqi = calculateUsAQI(pm25, pm10, o3, no2, so2, co);

        return {
          timestamp: time,
          aqi: aqi || 0,
          pm25: pm25 || null,
          pm10: pm10 || null,
          o3: o3 || null,
          no2: no2 || null,
          so2: so2 || null,
          co: co || null,
        };
      }).filter((item: any) => item.aqi > 0);

      // Aggregate to monthly for 1 year and 2 years
      if (timeRange === "1year" || timeRange === "2years") {
        const monthlyData: { [key: string]: { aqi: number[], timestamp: string } } = {};
        
        historicalData.forEach((item: any) => {
          const monthKey = item.timestamp.substring(0, 7); // YYYY-MM
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { aqi: [], timestamp: item.timestamp };
          }
          monthlyData[monthKey].aqi.push(item.aqi);
        });

        // Calculate average AQI per month
        historicalData = Object.keys(monthlyData).map(monthKey => {
          const aqiValues = monthlyData[monthKey].aqi;
          const avgAqi = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
          return {
            timestamp: monthlyData[monthKey].timestamp,
            aqi: avgAqi,
            pm25: null,
            pm10: null,
            o3: null,
            no2: null,
            so2: null,
            co: null,
          };
        }).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      }

      res.json({
        lat: latNum,
        lon: lonNum,
        timeRange,
        data: historicalData,
        count: historicalData.length,
        source: "Open-Meteo",
        dateRange: { start, end },
      });
    } catch (err: any) {
      console.error("Historical AQI error:", err?.message);
      return res.status(500).json({
        message: "Failed to fetch historical data",
        details: err?.message,
      });
    }
  });
   
  // Trip Planner
  app.post(api.trip.plan.path, async (req, res) => {
    try {
      const { start, end } = req.body;
      const userId = (req.session as any)?.userId;
      const startCoords = await fetchGeocoding(start, userId);
      const endCoords = await fetchGeocoding(end, userId);

      const [startData, endData] = await Promise.all([
        fetchAirQualityAndWeather(startCoords.lat, startCoords.lon, start),
        fetchAirQualityAndWeather(endCoords.lat, endCoords.lon, end),
      ]);

      startData.location = start;
      endData.location = end;

      let recommendation = "Both locations have similar air quality.";
      if (startData.airQuality.aqi > endData.airQuality.aqi + 20) {
        recommendation = `Air quality is better in ${end}. Good for travel.`;
      } else if (endData.airQuality.aqi > startData.airQuality.aqi + 20) {
        recommendation = `Air quality is significantly worse in ${end}. Consider precautions.`;
      }

      res.json({
        start: startData,
        end: endData,
        recommendation,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to plan trip" });
    }
  });

  return httpServer;
}
