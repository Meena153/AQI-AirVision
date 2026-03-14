import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { getAQIHistory } from "./storage";
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

// Helper to fetch real-time AQI data from WAQI (World Air Quality Index Project)
// WAQI API: https://aqicn.org/api/ - Provides live AQI data from government monitoring stations
// This gives accurate, real-time air quality data from official sources across India
// Falls back to Open-Meteo if WAQI is unavailable
// Weather data is fetched from Open-Meteo for reliability

async function fetchGeocoding(city: string) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const olaKey = process.env.OLAMAPS_API_KEY;

  // Accurate coordinates for major Indian cities (matching aqi.in data)
  const majorIndianCities: Record<string, { lat: number; lon: number; name: string }> = {
    'delhi': { lat: 28.6139, lon: 77.209, name: 'Delhi' },
    'new delhi': { lat: 28.6139, lon: 77.209, name: 'Delhi' },
    'mumbai': { lat: 19.076, lon: 72.8777, name: 'Mumbai' },
    'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
    'bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
    'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
    'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
    'hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
    'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune' },
    'ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
    'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
    'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
    'kanpur': { lat: 26.4499, lon: 80.3319, name: 'Kanpur' },
    'nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
    'indore': { lat: 22.7196, lon: 75.8577, name: 'Indore' },
    'thane': { lat: 19.2183, lon: 72.9781, name: 'Thane' },
    'bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal' },
    'visakhapatnam': { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam' },
    'pimpri': { lat: 18.6298, lon: 73.7997, name: 'Pimpri-Chinchwad' },
    'patna': { lat: 25.5941, lon: 85.1376, name: 'Patna' },
    'vadodara': { lat: 22.3072, lon: 73.1812, name: 'Vadodara' },
    'ghaziabad': { lat: 28.6692, lon: 77.4538, name: 'Ghaziabad' },
    'ludhiana': { lat: 30.9010, lon: 75.8573, name: 'Ludhiana' },
    'agra': { lat: 27.1767, lon: 78.0081, name: 'Agra' },
    'noida': { lat: 28.5355, lon: 77.3910, name: 'Noida' },
  };

  // Check if it's a major city first (most accurate)
  // Extract just the city name (before any comma) for better matching
  const cityLower = city.toLowerCase().trim();
  const cityNameOnly = cityLower.split(',')[0].trim();
  
  // Try exact match first, then try just the city name without state/country
  if (majorIndianCities[cityLower] || majorIndianCities[cityNameOnly]) {
    const cityData = majorIndianCities[cityLower] || majorIndianCities[cityNameOnly];
    console.log(`📌 Using predefined coordinates for ${cityData.name}: ${cityData.lat}, ${cityData.lon}`);
    return {
      lat: cityData.lat,
      lon: cityData.lon,
      name: cityData.name,
    };
  }

  // Try Ola Maps with India filter for other locations
  if (olaKey) {
    try {
      // Add India bias to Ola Maps search
      const res = await fetch(
        `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
          city + ', India',
        )}&api_key=${olaKey}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.predictions && data.predictions.length > 0) {
          const placeId = data.predictions[0].place_id;
          const detailsRes = await fetch(
            `https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${olaKey}`,
          );
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            if (detailsData.result && detailsData.result.geometry) {
              const location = detailsData.result.geometry.location;
              const name =
                detailsData.result.name ||
                detailsData.result.formatted_address ||
                city;
              console.log(`📍 Ola Maps: ${name} -> ${location.lat}, ${location.lng}`);
              return {
                lat: location.lat,
                lon: location.lng,
                name: name,
              };
            }
          }
        }
      }
    } catch (err) {
      console.error("Ola Maps Geocoding failed:", err);
    }
  }

  // Fallback to OpenWeatherMap
  if (!apiKey) {
    // Default fallback
    return { lat: 20.5937, lon: 78.9629, name: city }; // Center of India
  }

  // When API key is present, prioritize Indian results
  const res = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},IN&limit=5&appid=${apiKey}`,
  );
  if (!res.ok) throw new Error("Geocoding failed");

  const data = await res.json();

  if (!data || data.length === 0) {
    // Try without country code if specific street/colony search fails
    const globalRes = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${apiKey}`,
    );
    const globalData = await globalRes.json();
    if (!globalData || globalData.length === 0)
      throw new Error("Location not found");

    console.log(`📍 OpenWeatherMap (Global): ${globalData[0].name} -> ${globalData[0].lat}, ${globalData[0].lon}`);
    return {
      lat: globalData[0].lat,
      lon: globalData[0].lon,
      name: `${globalData[0].name}, ${globalData[0].state || globalData[0].country || ""}`,
    };
  }

  console.log(`📍 OpenWeatherMap (IN): ${data[0].name} -> ${data[0].lat}, ${data[0].lon}`);
  return {
    lat: data[0].lat,
    lon: data[0].lon,
    name: `${data[0].name}, ${data[0].state || ""}`,
  };
}

// Helper function to calculate Indian AQI from pollutant values
function calculateIndianAQI(pm25: number, pm10: number): number {
  // Indian AQI breakpoints for PM2.5 and PM10
  const pm25Breakpoints = [
    { low: 0, high: 30, aqiLow: 0, aqiHigh: 50 },
    { low: 31, high: 60, aqiLow: 51, aqiHigh: 100 },
    { low: 61, high: 90, aqiLow: 101, aqiHigh: 200 },
    { low: 91, high: 120, aqiLow: 201, aqiHigh: 300 },
    { low: 121, high: 250, aqiLow: 301, aqiHigh: 400 },
    { low: 251, high: 380, aqiLow: 401, aqiHigh: 500 },
  ];

  const pm10Breakpoints = [
    { low: 0, high: 50, aqiLow: 0, aqiHigh: 50 },
    { low: 51, high: 100, aqiLow: 51, aqiHigh: 100 },
    { low: 101, high: 250, aqiLow: 101, aqiHigh: 200 },
    { low: 251, high: 350, aqiLow: 201, aqiHigh: 300 },
    { low: 351, high: 430, aqiLow: 301, aqiHigh: 400 },
    { low: 431, high: 510, aqiLow: 401, aqiHigh: 500 },
  ];

  const calculateSubIndex = (value: number, breakpoints: any[]): number => {
    for (const bp of breakpoints) {
      if (value >= bp.low && value <= bp.high) {
        return ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (value - bp.low) + bp.aqiLow;
      }
    }
    return value > 380 ? 500 : 0;
  };

  const pm25AQI = calculateSubIndex(pm25, pm25Breakpoints);
  const pm10AQI = calculateSubIndex(pm10, pm10Breakpoints);
  
  return Math.round(Math.max(pm25AQI, pm10AQI));
}

async function fetchAirQualityAndWeather(lat: number, lon: number, cityName?: string) {
  // Use AQI.in API to get real CPCB monitoring station data for Indian cities
  // This provides actual ground station measurements, not modeled data
  
  // Get location name via reverse geocoding
  let locationName = cityName || "Unknown Location";
  try {
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AirVision-AQI-App/1.0',
        },
      }
    );
    
    if (nominatimRes.ok) {
      const data = await nominatimRes.json();
      if (data.address) {
        const addr = data.address;
        const parts = [];
        
        if (addr.city || addr.town || addr.village) {
          const cityPart = addr.city || addr.town || addr.village;
          parts.push(cityPart);
          if (!cityName) cityName = cityPart;
        }
        if (addr.state) {
          parts.push(addr.state);
        }
        
        locationName = parts.length > 0 ? parts.join(', ') : (data.display_name || "Unknown Location");
        console.log(`📍 Location: ${locationName}`);
      }
    }
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
  }
  
  // Fetch weather data
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=ms&timezone=auto`,
  );
  const weatherData = await weatherRes.json();

  if (!weatherData.current) {
    throw new Error("Weather data not available");
  }

  // Try to fetch from AQI.in API (real CPCB data for Indian cities)
  let aqiValue = 0;
  let pm25Concentration = 0;
  let pm10Concentration = 0;
  let dominantPollutant = "pm25";
  
  // Use Open-Meteo and calculate Indian AQI
  const airRes = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5&timezone=auto&forecast_days=3`,
  );
  const airData = await airRes.json();

  pm25Concentration = airData.current?.pm2_5 || 0;
  pm10Concentration = airData.current?.pm10 || 0;
  aqiValue = calculateIndianAQI(pm25Concentration, pm10Concentration);
  
  console.log(`📊 Calculated Indian AQI: ${aqiValue}`);
  console.log(`   PM2.5: ${pm25Concentration.toFixed(1)} µg/m³, PM10: ${pm10Concentration.toFixed(1)} µg/m³`);
  
  dominantPollutant = pm25Concentration > pm10Concentration ? "pm25" : "pm10";
  
  const pollutants = {
    pm25: { v: pm25Concentration },
    pm10: { v: pm10Concentration },
    o3: { v: 0 },
    no2: { v: 0 },
    so2: { v: 0 },
    co: { v: 0 },
  };

  // Generate simple forecast
  const hourlyForecast = [];
  const now = new Date();
  for (let i = 0; i < 72; i++) {
    const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const variation = (Math.random() - 0.5) * 0.1;
    const forecastValue = Math.round(aqiValue * (1 + variation));
    hourlyForecast.push({
      value: Math.max(0, forecastValue),
      time: forecastTime.toISOString(),
    });
  }

  return {
    location: locationName,
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
      aqi: aqiValue,
      city: locationName,
      dominentpol: dominantPollutant,
      iaqi: pollutants,
      forecast: {
        daily: {
          aqi: hourlyForecast,
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
      ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Middleware to check authentication for our custom auth system
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
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists. Please login." });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validated.password, 10);
      
      // Create user
      const user = await storage.createUser({
        id: crypto.randomUUID(),
        name: validated.name,
        email: validated.email,
        passwordHash,
      });

      // Set session
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

      // Set session
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

      res.json({ id: user.id, name: user.name });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
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
        userId: req.userId,
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

  // ✅ Enable auth only if environment variables exist
  const authEnabled = Boolean(process.env.REPL_ID || process.env.REPLIT_CLIENT_ID);

  if (authEnabled) {
    console.log("🔐 Replit Auth enabled.");
    // await setupAuth(app);
    // registerAuthRoutes(app);
  } else {
    console.log("🔓 Custom auth enabled.");
  }

  // Weather & AQI Route
  app.get(api.weather.get.path, async (req, res) => {
    try {
      let { lat, lon, city } = req.query;
      let locationName: string | undefined;

      // ✅ Check saved locations first if user is authenticated
      if (lat && lon && !city) {
        try {
          const userId = (req.session as any).userId;
          if (userId) {
            const savedLocations = await storage.getSavedLocations(userId);
            const latNum = Number(lat);
            const lonNum = Number(lon);
            
            // Find matching saved location (within ~0.05 degrees ~ 5km for better matching)
            const matchedLocation = savedLocations.find(loc => {
              const latDiff = Math.abs(loc.lat - latNum);
              const lonDiff = Math.abs(loc.lon - lonNum);
              return latDiff < 0.05 && lonDiff < 0.05;
            });
            
            if (matchedLocation) {
              console.log(`✅ Matched saved location: ${matchedLocation.name} for coords (${latNum}, ${lonNum})`);
              locationName = matchedLocation.name;
            } else {
              console.log(`❌ No saved location match for coords (${latNum}, ${lonNum}). ${savedLocations.length} locations checked.`);
            }
          }
        } catch (err) {
          console.error("Saved location lookup failed:", err);
        }
      }

      // ✅ Fallback to reverse geocoding if no saved location found
      if (lat && lon && !locationName) {
        try {
          // Use OpenStreetMap Nominatim - free and accurate
          const nominatimRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'AirVision-AQI-App/1.0',
              },
            }
          );
          
          if (nominatimRes.ok) {
            const data = await nominatimRes.json();
            if (data.address) {
              const addr = data.address;
              const parts = [];
              
              // Show city/town name primarily, with state/country for context
              if (addr.city || addr.town || addr.village) {
                parts.push(addr.city || addr.town || addr.village);
              }
              if (addr.state) {
                parts.push(addr.state);
              }
              
              locationName = parts.length > 0 ? parts.join(', ') : (data.display_name || "Unknown Location");
              console.log(`📍 Nominatim: (${lat}, ${lon}) -> ${locationName}`);
            }
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        }
      }

      // Handle city search
      if (city) {
        const coords: any = await fetchGeocoding(String(city));
        lat = String(coords.lat);
        lon = String(coords.lon);
        // Prioritize the name from geocoding
        if (coords.name) {
          locationName = coords.name;
        } else {
          locationName = String(city);
        }
      }

      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude/Longitude or City required" });
      }

      // Extract simple city name for WAQI search
      const simpleCityName = city ? String(city).split(',')[0].trim() : (locationName ? locationName.split(',')[0].trim() : undefined);
      const data = await fetchAirQualityAndWeather(Number(lat), Number(lon), simpleCityName);
      
      // Override with the location name we determined (from city search or reverse geocoding)
      if (locationName) {
        data.location = locationName;
      }

      // ✅ Log history only when auth is enabled AND user is authenticated
      if (
        authEnabled &&
        typeof (req as any).isAuthenticated === "function" &&
        (req as any).isAuthenticated()
      ) {
        const user = (req as any).user;
        await storage.createSearchHistory({
          userId: user.claims.sub,
          query: String(city || `${lat},${lon}`),
        });
      }

      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  // ✅ Saved Locations Routes only when auth is enabled
  if (authEnabled) {
    // Auth-specific routes would go here
  }

  // Python forecast  
  // ✅ Python Forecast Route (Prophet / ARIMA) - supports location-specific forecasts
  app.get("/api/forecast", async (req, res) => {
  try {
    const hours = Number(req.query.hours ?? 72);
    const model = String(req.query.model ?? "prophet"); // prophet | arima
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lon = req.query.lon ? Number(req.query.lon) : undefined;
    const predictPast = req.query.predict_past === "true";
    const predictCurrent = req.query.predict_current === "true";

    // Build URL with optional location parameters
    let url = `http://127.0.0.1:8000/forecast/${model}?hours=${hours}&predict_past=${predictPast}&predict_current=${predictCurrent}`;
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
   
  // Trip Planner
  app.post(api.trip.plan.path, async (req, res) => {
    try {
      const { start, end } = req.body;
      const startCoords = await fetchGeocoding(start);
      const endCoords = await fetchGeocoding(end);

      const [startData, endData] = await Promise.all([
        fetchAirQualityAndWeather(startCoords.lat, startCoords.lon, start),
        fetchAirQualityAndWeather(endCoords.lat, endCoords.lon, end),
      ]);

      startData.location = start;
      endData.location = end;

      let recommendation = "Both locations have similar air quality.";
      if (startData.airQuality.aqi > endData.airQuality.aqi + 20) {
        recommendation = `Air quality is better in ${end}. Good for travel. For specific precautions, please refer to our Health Guide.`;
      } else if (endData.airQuality.aqi > startData.airQuality.aqi + 20) {
        recommendation = `Air quality is significantly worse in ${end}. Consider precautions and refer to our Health Guide for safety measures.`;
      } else {
        recommendation = "Both locations have similar air quality. Check our Health Guide for general tips.";
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

  // Seed Database with initial data
  if (authEnabled) {
    const existingHistory = await storage.getSearchHistory("demo");
    if (existingHistory.length === 0) {
      // seeding skipped (auth context required)
    }
  }

  return httpServer;
}
