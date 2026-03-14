# Multi-Source Air Quality Data Integration

## Overview

The application now integrates **three air quality data sources** with an intelligent fallback system for maximum accuracy and availability:

1. **WAQI (World Air Quality Index)** - Primary source (aqicn.org, waqi.info)
2. **OpenWeatherMap Air Pollution API** - Secondary source
3. **Open-Meteo** - Fallback source (always available)

## Data Source Priority

The system tries each source in order until data is successfully retrieved:

```
WAQI (Government Stations) → OpenWeatherMap (Global Coverage) → Open-Meteo (Always Available)
```

### Why Multiple Sources?

- **Maximum Availability**: If one source fails, others provide backup
- **Global Coverage**: Different sources excel in different regions
- **Data Accuracy**: WAQI provides real station data where available
- **No Downtime**: Open-Meteo ensures the app always works
- **Cost Effective**: Free tiers of all three APIs combined provide excellent coverage

## What Changed (v2.0)

### 1. **Multi-Source Air Quality Data Integration**

#### Server-Side Changes (`server/routes.ts`)
- ✅ **Added OpenWeatherMap Air Pollution API** as secondary data source
- ✅ **Intelligent fallback system**: WAQI → OpenWeatherMap → Open-Meteo
- ✅ Enhanced logging showing which source was used and why
- ✅ Detailed console output for debugging data source selection
- ✅ Pollutant concentration data from all sources
- ✅ Forecast data from available sources

#### Data Source Attribution
- `"WAQI/aqicn.org (Government Station)"` - Government monitoring station data
- `"OpenWeatherMap Air Pollution API"` - Global coverage with satellite + modeled data
- `"Open-Meteo (Modeled Data)"` - Modeled air quality data

#### Frontend Changes (Planned)
- Data source badge showing which API provided the data
- Different color coding for different data sources
- Links to source websites for transparency
- Station information when WAQI data is used

### 2. **Environment Configuration**

Updated `.env.example` with:
```env
# Air Quality APIs (Priority order)
WAQI_API_KEY=your_key              # Primary: Government stations
OPENWEATHERMAP_API_KEY=your_key    # Secondary: Global coverage
# Open-Meteo requires no key        # Fallback: Always available
```

### 3. **Enhanced Schema**

Updated `shared/schema.ts` to include:
```typescript
export type AirQualityData = {
  // ... existing fields
  dataSource?: string;  // "WAQI/aqicn.org" | "OpenWeatherMap" | "Open-Meteo"
  stationName?: string; // Only for WAQI
  stationUrl?: string;  // Only for WAQI - Direct link to station
};
```

## Data Sources

### 1. WAQI (World Air Quality Index) - PRIMARY

- **Website:** https://aqicn.org and https://waqi.info
- **Data Type:** Real-time from official government monitoring stations (EPA, CPCB, etc.)
- **API:** WAQI API (requires `WAQI_API_KEY` in environment)
- **Coverage:** Major cities worldwide with government stations
- **Accuracy:** ⭐⭐⭐⭐⭐ Highest - real certified monitoring equipment
- **Update Frequency:** Real-time (updated as stations report)
- **Free Tier:** 1,000 requests per second
- **Forecast:** 7-day forecast when available

**Strengths:**
- Most accurate data from ground-truth measurements
- Provides station name and location
- Direct links to aqicn.org for detailed info
- Individual pollutant readings

**Limitations:**
- Limited to areas with government monitoring stations
- Not available in rural or remote areas
- Requires API key (free but needs registration)

### 2. OpenWeatherMap Air Pollution API - SECONDARY

- **Website:** https://openweathermap.org/api/air-pollution
- **Data Type:** Combination of satellite, modeled, and ground data
- **API:** OpenWeatherMap Air Pollution API (requires `OPENWEATHERMAP_API_KEY`)
- **Coverage:** Excellent global coverage including remote areas
- **Accuracy:** ⭐⭐⭐⭐ Good - validated models with satellite data
- **Update Frequency:** Hourly
- **Free Tier:** 1,000 calls per day
- **Forecast:** 5-day hourly forecast

**Strengths:**
- Excellent global coverage
- Provides detailed pollutant concentrations (µg/m³)
- Includes 5-day forecast
- Works in areas without ground stations
- Same API key as geocoding service

**Limitations:**
- Requires API key
- Free tier limited to 1,000 calls/day
- May be less accurate in areas without ground validation

### 3. Open-Meteo - FALLBACK

- **Website:** https://open-meteo.com
- **Data Type:** Modeled air quality data from CAMS (Copernicus Atmosphere Monitoring Service)
- **API:** Open-Meteo Air Quality API (no API key required)
- **Coverage:** Complete global coverage
- **Accuracy:** ⭐⭐⭐ Good for general reference
- **Update Frequency:** Hourly updates
- **Free Tier:** Unlimited, no API key required
- **Forecast:** 3-day forecast

**Strengths:**
- No API key required - always works
- Unlimited free access
- Global coverage including oceans
- 3-day forecast included
- No rate limiting

**Limitations:**
- Modeled data may be less accurate
- No station information
- Limited to US EPA AQI standard

## Comparison Table

| Feature | WAQI | OpenWeatherMap | Open-Meteo |
|---------|------|----------------|------------|
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Coverage** | Major cities | Global | Global |
| **API Key** | Required (free) | Required (free) | Not required |
| **Free Limit** | 1000 req/sec | 1000 req/day | Unlimited |
| **Forecast** | 7 days | 5 days | 3 days |
| **Data Source** | Government stations | Satellite + Model | CAMS Model |
| **Pollutants** | PM2.5, PM10, O3, NO2, SO2, CO | PM2.5, PM10, O3, NO2, SO2, CO, NH3 | PM2.5, PM10, O3, NO2, SO2, CO |
| **Station Info** | ✅ Yes | ❌ No | ❌ No |
| **Best For** | Urban areas | Global coverage | Guaranteed availability |

## How It Works

### 1. Multi-Source Data Fetching Flow

```
User searches for location
    ↓
Get geographic coordinates (lat, lon)
    ↓
┌─────────────────────────────────┐
│ Try Source 1: WAQI              │
│ - Query government station data │
│ - If found: Use WAQI data ✓     │
│ - If failed: Continue to next   │
└─────────────────────────────────┘
    ↓ (if WAQI fails or unavailable)
┌─────────────────────────────────┐
│ Try Source 2: OpenWeatherMap    │
│ - Query global pollution data   │
│ - If found: Use OWM data ✓      │
│ - If failed: Continue to next   │
└─────────────────────────────────┘
    ↓ (if both WAQI and OWM fail)
┌─────────────────────────────────┐
│ Try Source 3: Open-Meteo        │
│ - Query modeled AQI data        │
│ - Always available ✓            │
└─────────────────────────────────┘
    ↓
Return AQI data with source attribution
    ↓
Display in UI with data source badge
```

### 2. Console Logging Example

When the server fetches AQI data, you'll see detailed logs:

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

Or if WAQI is not available:

```
🔍 Multi-source AQI fetch for lat: 40.7128, lon: -74.0060
  1️⃣ Trying WAQI... API Key: NO
  2️⃣ Trying OpenWeatherMap... API Key: YES
  ✅ OpenWeatherMap SUCCESS!
  🌐 Source: OpenWeatherMap Air Pollution API
  📈 AQI: 42 (calculated from pollutant concentrations)
  Pollutant Concentrations:
    PM2.5: 8.2 µg/m³ | PM10: 12.5 µg/m³
    NO2: 15.3 µg/m³ | SO2: 3.1 µg/m³
    O3: 45.2 µg/m³ | CO: 280.0 µg/m³

📊 Final Air Quality Data for location:
  ✅ Data Source: OpenWeatherMap Air Pollution API
  📈 AQI: 42
  🎯 Dominant Pollutant: PM25
```

### 3. Station URL Format (WAQI Only)

When WAQI data is available, the app generates a direct link:
```
https://aqicn.org/city/{station-slug}
```

Example:
- Station: "Delhi, India"
- URL: `https://aqicn.org/city/delhi`

### 4. User-Visible Attribution

#### On Air Quality Page:
```
📘 Data Source Information

Source: WAQI/aqicn.org (Government Station)
Station: Delhi, India
[View on aqicn.org →]

Air quality data from government monitoring stations 
providing the most accurate real-time readings.
```

Or:

```
📘 Data Source Information

Source: OpenWeatherMap Air Pollution API

Global air quality data combining satellite imagery 
and atmospheric modeling for worldwide coverage.
```

#### In Footer:
```
Air quality data powered by WAQI (aqicn.org), 
OpenWeatherMap, and Open-Meteo
```

## API Requirements

### Environment Variables

Configure API keys in your `.env` file:

```bash
# Priority 1: WAQI (Recommended for urban areas)
# Get your free API key from https://aqicn.org/data-platform/token/
WAQI_API_KEY=your_waqi_api_key_here

# Priority 2: OpenWeatherMap (Recommended for global coverage)
# Get your free API key from https://openweathermap.org/api
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here

# Priority 3: Open-Meteo (No API key required - automatic fallback)
```

### Getting API Keys

#### WAQI API Key (Priority 1)
1. Visit https://aqicn.org/data-platform/token/
2. Fill out the API token request form
3. Receive token via email (usually within 24 hours)
4. Add to `.env`: `WAQI_API_KEY=your_token_here`
5. Restart the server

**Free Tier:**
- 1,000 requests per second
- No daily limit for standard usage
- Access to government station data

#### OpenWeatherMap API Key (Priority 2)
1. Create account at https://openweathermap.org/
2. Go to https://home.openweathermap.org/api_keys
3. Generate a new API key
4. Wait up to 2 hours for activation
5. Add to `.env`: `OPENWEATHERMAP_API_KEY=your_key_here`
6. Restart the server

**Free Tier:**
- 1,000 calls per day
- Current + 5-day forecast
- Global coverage

#### Open-Meteo (Priority 3)
- No API key required
- Automatic fallback
- Always available
- Unlimited usage

### Minimum Configuration

**For Testing/Development:**
```env
# No API keys required - uses Open-Meteo
```

**For Production (Recommended):**
```env
WAQI_API_KEY=your_waqi_key
OPENWEATHERMAP_API_KEY=your_owm_key
# Open-Meteo as automatic fallback
```

## Benefits

1. **Accurate Data** - Uses official government monitoring stations
2. **Credible Source** - Same data as aqicn.org (trusted globally)
3. **Transparency** - Clear attribution and source links
4. **Verifiable** - Users can click through to verify data
5. **Real-time** - Direct from monitoring stations

## Data Accuracy

### Why values match aqicn.org:
- ✅ Same API (WAQI)
- ✅ Same stations
- ✅ Same calculation method
- ✅ Same update frequency

### Why values might differ slightly:
- Different station selection (worst-case vs nearest)
- Update timing (data refreshes every ~10-15 minutes)
- Rounding differences

## Testing the Multi-Source Integration

### Test Scenario 1: WAQI Only
```bash
# Test WAQI as primary source
WAQI_API_KEY=your_key
# Comment out other keys
```

**Expected Result:**
```
🔍 Multi-source AQI fetch for lat: 28.6139, lon: 77.2090
  1️⃣ Trying WAQI... API Key: YES
  ✅ WAQI SUCCESS!
📊 Final Air Quality Data:
  ✅ Data Source: WAQI/aqicn.org (Government Station)
```

### Test Scenario 2: OpenWeatherMap Fallback
```bash
# Test OpenWeatherMap as fallback
# WAQI_API_KEY=  # commented out
OPENWEATHERMAP_API_KEY=your_key
```

**Expected Result:**
```
🔍 Multi-source AQI fetch for lat: 40.7128, lon: -74.0060
  1️⃣ Trying WAQI... API Key: NO
  2️⃣ Trying OpenWeatherMap... API Key: YES
  ✅ OpenWeatherMap SUCCESS!
📊 Final Air Quality Data:
  ✅ Data Source: OpenWeatherMap Air Pollution API
```

### Test Scenario 3: Open-Meteo Fallback
```bash
# Test Open-Meteo as final fallback
# WAQI_API_KEY=  # commented out
# OPENWEATHERMAP_API_KEY=  # commented out
```

**Expected Result:**
```
🔍 Multi-source AQI fetch for lat: 51.5074, lon: -0.1278
  1️⃣ Trying WAQI... API Key: NO
  2️⃣ Trying OpenWeatherMap... API Key: NO
  3️⃣ Trying Open-Meteo...
  ✅ Open-Meteo SUCCESS!
📊 Final Air Quality Data:
  ✅ Data Source: Open-Meteo (Modeled Data)
```

### Test Scenario 4: Full Priority Chain
```bash
# Test with all keys configured
WAQI_API_KEY=your_waqi_key
OPENWEATHERMAP_API_KEY=your_owm_key
```

**Expected Result:**
- Urban areas: Should use WAQI (most accurate)
- Rural areas: Should fallback to OpenWeatherMap
- Remote areas: Should fallback to Open-Meteo

### Verify Data Sources in UI

1. **Search for Delhi, India**
   - Should show: `Source: WAQI/aqicn.org (Government Station)`
   - Should have: "View on aqicn.org" link
   - Should show: Station name

2. **Search for a remote location**
   - Should show: `Source: OpenWeatherMap Air Pollution API` or `Open-Meteo`
   - Should show: Pollutant concentrations

3. **Compare with aqicn.org**
   - Visit https://aqicn.org
   - Search same city
   - AQI values should match when using WAQI data

### Server Console Logs

Monitor the server console to see which source is being used:

```bash
npm run dev
```

Then search for a location and observe the detailed logs showing:
- Which sources were attempted
- Which source succeeded
- Data quality and pollution levels

## UI Examples

### Before:
```
Source: WAQI (Government Station)
Station: Delhi, India
```

### After:
```
📘 Data Source Information
Air quality data from WAQI (World Air Quality Index) - 
official government monitoring stations. Same data source 
as aqicn.org and waqi.info.

Source: WAQI/aqicn.org (Government Station)
Station: Delhi - DTU
[View on aqicn.org →]
```

## Files Modified

### Version 2.0 (Multi-Source Integration)

1. **`server/routes.ts`**
   - Added OpenWeatherMap Air Pollution API integration
   - Implemented intelligent multi-source fallback system
   - Enhanced logging with detailed source information
   - Added forecast data from multiple sources

2. **`shared/schema.ts`**
   - Updated `AirQualityData` type with detailed source attribution
   - Added comments documenting possible data source values

3. **`.env.example`**
   - Added `OPENWEATHERMAP_API_KEY` configuration
   - Updated documentation for all three sources
   - Added priority order information

4. **`AQICN_INTEGRATION.md`** (this file)
   - Updated with multi-source integration details
   - Added comparison tables
   - Enhanced testing instructions

5. **`API_INTEGRATION_GUIDE.md`** (new)
   - Comprehensive guide for all three APIs
   - Detailed setup instructions
   - Rate limiting and best practices
   - Troubleshooting guide

## Data Accuracy & Reliability

### Accuracy by Source

**WAQI (Government Stations):**
- ⭐⭐⭐⭐⭐ Highest accuracy
- Real-time measurements from certified equipment
- Direct from EPA, CPCB, and other agencies
- Perfect for urban areas with monitoring stations

**OpenWeatherMap:**
- ⭐⭐⭐⭐ Good accuracy
- Validated atmospheric models
- Combines satellite and ground data
- Excellent for areas without stations

**Open-Meteo:**
- ⭐⭐⭐ Fair accuracy
- CAMS modeled data
- Useful for general reference
- Always available globally

### Why Values May Differ

When comparing with aqicn.org:
- ✅ Same values when WAQI source is used
- Different station selection (nearest vs worst-case)
- Update timing (10-15 minute intervals)
- Rounding/calculation differences with modeled data

### Data Verification

Users can verify data by:
1. Checking the data source badge in the UI
2. Clicking "View on aqicn.org" for WAQI data
3. Comparing with official sources (EPA, CPCB, etc.)
4. Checking pollutant concentrations match expected ranges

## Compliance & Attribution

### WAQI/aqicn.org Terms:
- ✅ Proper attribution displayed
- ✅ Links to aqicn.org provided
- ✅ Data source clearly stated
- ✅ No modification of raw AQI values
- ✅ Free tier usage within limits

### OpenWeatherMap Terms:
- ✅ Attribution to OpenWeatherMap
- ✅ Free tier usage (1,000 calls/day)
- ✅ API key secured in environment variables
- ✅ Data used according to ToS

### Open-Meteo Terms:
- ✅ Open-source and free to use
- ✅ Attribution provided
- ✅ No API key required
- ✅ Unlimited usage allowed

## Additional Resources

- **Detailed API Guide:** See [API_INTEGRATION_GUIDE.md](API_INTEGRATION_GUIDE.md)
- **Location Services:** See [LOCATION_API_GUIDE.md](LOCATION_API_GUIDE.md)
- **Quick Start:** See [QUICK_START.md](QUICK_START.md)

## Future Enhancements

- [ ] Add source reliability metrics
- [ ] Implement data quality scoring
- [ ] Cache responses to reduce API calls
- [ ] Add user preference for data source
- [ ] Historical data from multiple sources
- [ ] Compare readings across sources
- [ ] Add aqicn.org widget integration
- [ ] Show station map powered by aqicn.org
- [ ] Forecast comparison across sources

---

**Data Attribution:** This application uses air quality data from multiple sources:

1. **World Air Quality Index Project (aqicn.org)** - Government monitoring station data from EPA, CPCB, and other environmental protection agencies worldwide.

2. **OpenWeatherMap** - Global air pollution data combining satellite imagery, atmospheric modeling, and ground-based measurements.

3. **Open-Meteo** - Atmospheric quality data from CAMS (Copernicus Atmosphere Monitoring Service), providing global coverage through validated models.

All data sources are properly attributed in the user interface, and users can verify data directly from the source websites.
