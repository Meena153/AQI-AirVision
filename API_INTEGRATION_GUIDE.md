# Multi-Source Air Quality API Integration Guide

## Overview

The AirVision application now integrates **three air quality data sources** with an intelligent fallback system to ensure maximum data availability and accuracy:

1. **WAQI (World Air Quality Index)** - Primary source for government station data
2. **OpenWeatherMap Air Pollution API** - Secondary source with global coverage
3. **Open-Meteo** - Fallback source with modeled data (no API key required)

## Data Source Priority

The system tries each source in order until data is successfully retrieved:

```
┌─────────────────────────────────────────────┐
│  1️⃣ WAQI (aqicn.org)                        │
│     ✅ Real government monitoring stations   │
│     ✅ Most accurate AQI data                │
│     ⚠️ Requires API key                     │
│     ⚠️ Limited geographic coverage          │
└─────────────────────────────────────────────┘
                    ↓ (if failed)
┌─────────────────────────────────────────────┐
│  2️⃣ OpenWeatherMap Air Pollution API        │
│     ✅ Good global coverage                  │
│     ✅ Pollutant concentrations (µg/m³)      │
│     ✅ 5-day forecast available              │
│     ⚠️ Requires API key                     │
└─────────────────────────────────────────────┘
                    ↓ (if failed)
┌─────────────────────────────────────────────┐
│  3️⃣ Open-Meteo                              │
│     ✅ Always available (no API key)         │
│     ✅ Global coverage                       │
│     ✅ 3-day forecast                        │
│     ⚠️ Modeled data (less accurate)         │
└─────────────────────────────────────────────┘
```

## API Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# WAQI API Key (Optional but recommended)
# Get your free API key at: https://aqicn.org/data-platform/token/
WAQI_API_KEY=your_waqi_api_key_here

# OpenWeatherMap API Key (Optional but recommended)
# Get your free API key at: https://openweathermap.org/api
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here

# Database and other configs
DATABASE_URL=postgresql://...
SESSION_SECRET=your_session_secret
```

### API Key Setup Instructions

#### 1. WAQI API Key (Recommended)

**Why?** WAQI provides the most accurate data from real government monitoring stations.

**How to get:**
1. Visit https://aqicn.org/data-platform/token/
2. Fill out the API token request form
3. You'll receive an API token via email (usually within 24 hours)
4. Add to `.env`: `WAQI_API_KEY=your_token_here`

**Free Tier Limits:**
- 1,000 requests per second
- No daily limit for standard usage

#### 2. OpenWeatherMap API Key (Recommended)

**Why?** OpenWeatherMap has excellent global coverage and provides detailed pollutant data.

**How to get:**
1. Create an account at https://openweathermap.org/
2. Go to https://home.openweathermap.org/api_keys
3. Generate a new API key
4. Add to `.env`: `OPENWEATHERMAP_API_KEY=your_api_key_here`

**Free Tier Limits:**
- 1,000 calls per day
- Current air pollution data
- 5-day air pollution forecast
- Hourly forecast for 4 days

**Note:** It may take up to 2 hours for your API key to activate.

#### 3. Open-Meteo (No API Key Required)

**Why?** Open-Meteo serves as a reliable fallback that always works.

**Features:**
- No registration required
- No API key needed
- Free unlimited access
- Global coverage
- 3-day forecast

## Data Source Comparison

| Feature | WAQI | OpenWeatherMap | Open-Meteo |
|---------|------|----------------|------------|
| **API Key Required** | Yes (free) | Yes (free) | No |
| **Data Type** | Government stations | Modeled + Satellite | Modeled |
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Global Coverage** | Limited | Excellent | Excellent |
| **Forecast Days** | 7 | 5 | 3 |
| **Pollutants** | PM2.5, PM10, O3, NO2, SO2, CO | PM2.5, PM10, O3, NO2, SO2, CO, NH3 | PM2.5, PM10, O3, NO2, SO2, CO |
| **Update Frequency** | Real-time | Hourly | Hourly |
| **Free Tier Limit** | 1000 req/sec | 1000 req/day | Unlimited |

## API Endpoints Used

### 1. WAQI API

```
GET https://api.waqi.info/feed/geo:{lat};{lon}/?token={api_key}
```

**Response includes:**
- AQI value (US EPA standard)
- Station name and location
- Individual pollutant readings (iaqi)
- Forecast data
- Attribution information

### 2. OpenWeatherMap Air Pollution API

**Current Data:**
```
GET http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}
```

**Forecast Data:**
```
GET http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat={lat}&lon={lon}&appid={api_key}
```

**Response includes:**
- Air quality index (1-5 scale, converted to US EPA)
- Pollutant concentrations in µg/m³
- Timestamp for each reading
- Forecast for next 5 days

### 3. Open-Meteo Air Quality API

```
GET https://air-quality-api.open-meteo.com/v1/air-quality?
    latitude={lat}&longitude={lon}
    &current=pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,us_aqi
    &hourly=us_aqi
    &timezone=auto
    &forecast_days=3
```

**Response includes:**
- Current air quality data
- US EPA AQI
- Pollutant concentrations
- Hourly forecast for 3 days

## Implementation Details

### Multi-Source Fetching Logic

The implementation in [server/routes.ts](server/routes.ts) follows this pattern:

```typescript
let dataFetched = false;

// Try WAQI first
if (WAQI_API_KEY && !dataFetched) {
  try {
    // Fetch from WAQI
    // If successful, set dataFetched = true
  } catch (error) {
    // Log error and continue to next source
  }
}

// Try OpenWeatherMap
if (OPENWEATHERMAP_API_KEY && !dataFetched) {
  try {
    // Fetch from OpenWeatherMap
    // If successful, set dataFetched = true
  } catch (error) {
    // Log error and continue to next source
  }
}

// Fallback to Open-Meteo
if (!dataFetched) {
  try {
    // Fetch from Open-Meteo
    // If successful, set dataFetched = true
  } catch (error) {
    // Throw error - all sources failed
  }
}
```

### AQI Calculation

Different sources provide AQI in different formats:

- **WAQI**: Provides US EPA AQI directly
- **OpenWeatherMap**: Provides 1-5 scale, we convert to US EPA AQI using pollutant concentrations
- **Open-Meteo**: Provides US EPA AQI directly

## Data Attribution

The application properly attributes data sources in the UI:

### WAQI Attribution
```
Source: WAQI/aqicn.org (Government Station)
Station: [Station Name]
View on aqicn.org →
```

### OpenWeatherMap Attribution
```
Source: OpenWeatherMap Air Pollution API
Data from OpenWeatherMap
```

### Open-Meteo Attribution
```
Source: Open-Meteo (Modeled Data)
Data from Open-Meteo
```

## Testing the Integration

### 1. Test WAQI Only
```bash
# Set only WAQI key
WAQI_API_KEY=your_key
# Unset others
OPENWEATHERMAP_API_KEY=
```

### 2. Test OpenWeatherMap Fallback
```bash
# Set only OpenWeatherMap key
WAQI_API_KEY=
OPENWEATHERMAP_API_KEY=your_key
```

### 3. Test Open-Meteo Fallback
```bash
# Unset all API keys
WAQI_API_KEY=
OPENWEATHERMAP_API_KEY=
```

### 4. Test Full Priority Chain
```bash
# Set all API keys
WAQI_API_KEY=your_waqi_key
OPENWEATHERMAP_API_KEY=your_owm_key
```

## Console Logging

The application provides detailed console logs to show which source was used:

```
🔍 Multi-source AQI fetch for lat: 28.6139, lon: 77.2090
  1️⃣ Trying WAQI... API Key: YES
  ✅ WAQI SUCCESS!
  🌐 Source: WAQI/aqicn.org (Government Station)
  🏢 Station: Delhi, India
  📈 AQI: 156
  🔗 URL: https://aqicn.org/city/delhi

📊 Final Air Quality Data for Delhi:
  ✅ Data Source: WAQI/aqicn.org (Government Station)
  📈 AQI: 156
  🎯 Dominant Pollutant: PM25
  🏢 Station: Delhi, India
```

## Rate Limiting Recommendations

To avoid hitting API limits:

1. **Implement caching**: Cache responses for 10-15 minutes
2. **Use database**: Store recent AQI readings in the database
3. **Batch requests**: When possible, batch multiple location requests
4. **Monitor usage**: Track API calls to avoid limits

### Example Caching Implementation

```typescript
// Simple in-memory cache with 15-minute expiry
const aqiCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function getCachedAQI(lat: number, lon: number) {
  const key = `${lat},${lon}`;
  const cached = aqiCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  return null;
}

function setCachedAQI(lat: number, lon: number, data: any) {
  const key = `${lat},${lon}`;
  aqiCache.set(key, { data, timestamp: Date.now() });
}
```

## Troubleshooting

### Issue: All API sources failing

**Possible causes:**
1. No internet connection
2. All API keys are invalid or expired
3. Geographic location not covered by any source

**Solution:**
- Check internet connection
- Verify API keys are correct and active
- Check API provider status pages

### Issue: OpenWeatherMap not working

**Possible causes:**
1. API key not activated yet (takes up to 2 hours)
2. Free tier limit exceeded (1000 calls/day)
3. Invalid API key

**Solution:**
- Wait for API key activation
- Check OpenWeatherMap dashboard for usage
- Verify API key is correct

### Issue: WAQI returning no data

**Possible causes:**
1. No monitoring station near the location
2. API token expired or invalid
3. Location coordinates incorrect

**Solution:**
- Try a major city first to verify API key works
- Check https://aqicn.org to see if a station exists for your location
- Verify latitude/longitude are correct

## Best Practices

1. **Always set all three API keys** for maximum reliability
2. **Implement caching** to reduce API calls
3. **Monitor API usage** to stay within free tier limits
4. **Display data source** to users for transparency
5. **Log errors** to identify which sources are failing
6. **Respect rate limits** to avoid being blocked

## Support and Resources

- **WAQI Documentation**: https://aqicn.org/api/
- **OpenWeatherMap Docs**: https://openweathermap.org/api/air-pollution
- **Open-Meteo Docs**: https://open-meteo.com/en/docs/air-quality-api
- **AQI Standards**: https://www.airnow.gov/aqi/aqi-basics/

## License and Terms

- **WAQI**: Free for non-commercial use, attribution required
- **OpenWeatherMap**: Free tier available, see https://openweathermap.org/price
- **Open-Meteo**: Free and open-source, no attribution required

## Updates and Changelog

### v2.0 (Latest)
- ✅ Added OpenWeatherMap Air Pollution API integration
- ✅ Implemented multi-source fallback system
- ✅ Enhanced logging for debugging
- ✅ Updated schema with detailed data source information

### v1.0
- Initial WAQI and Open-Meteo integration
