# Quick Start Guide

## Air Quality APIs

### Available Data Sources

The app uses **three air quality data sources** with automatic fallback:

1. **WAQI** (Primary) - Real government station data
2. **OpenWeatherMap** (Secondary) - Global coverage
3. **Open-Meteo** (Fallback) - Always available (no API key)

### Quick Setup

**Minimum (Works without any API keys):**
```bash
# Uses Open-Meteo automatically
# No setup needed - just run the app!
```

**Recommended (Better accuracy):**
```bash
# Add to .env file:
WAQI_API_KEY=your_waqi_key_here
OPENWEATHERMAP_API_KEY=your_owm_key_here
```

**Get API Keys:**
- **WAQI**: https://aqicn.org/data-platform/token/ (free, ~24h approval)
- **OpenWeatherMap**: https://openweathermap.org/api (free, instant)

### Data Source Comparison

| Source | Accuracy | Coverage | API Key | Free Limit |
|--------|----------|----------|---------|------------|
| **WAQI** | ⭐⭐⭐⭐⭐ | Major cities | Required | 1000 req/sec |
| **OpenWeatherMap** | ⭐⭐⭐⭐ | Global | Required | 1000 req/day |
| **Open-Meteo** | ⭐⭐⭐ | Global | Not needed | Unlimited |

**For detailed information:** See [API_INTEGRATION_GUIDE.md](API_INTEGRATION_GUIDE.md)

---

## Location APIs

### How to Change Your Location Provider

1. **Login** to AirVision
2. Click your **profile picture** (top right)
3. Select **Settings**
4. Scroll to **Location API Provider**
5. Choose your preferred provider
6. Click **Save Changes**

### Provider Comparison

| Provider | Cost | Accuracy | Speed | Setup |
|----------|------|----------|-------|-------|
| **Nominatim** | Free | Good | Medium | None needed ✅ |
| **OpenWeatherMap** | Free tier | Good | Fast | API key needed |
| **Google** | Paid ($) | Excellent | Fast | API key needed |
| **Mapbox** | Free tier | Excellent | Very Fast | API key needed |

### Which Provider Should I Use?

- **For most users**: Nominatim (default, no setup)
- **For better performance**: OpenWeatherMap or Mapbox (free tier)
- **For best accuracy**: Google Geocoding (paid)

---

## Developer Setup

### Complete .env Configuration

1. **Copy example file:**
   ```bash
   cp .env.example .env
   ```

2. **Add all API keys:**
   ```bash
   # Air Quality APIs (Recommended)
   WAQI_API_KEY=your_waqi_key
   OPENWEATHERMAP_API_KEY=your_owm_key
   
   # Location APIs (Optional - Nominatim works without keys)
   GOOGLE_GEOCODING_API_KEY=your_google_key
   MAPBOX_API_KEY=your_mapbox_key
   
   # Database
   DATABASE_URL=postgresql://user:pass@localhost:5432/airvision
   
   # Session
   SESSION_SECRET=your_random_secret_here
   ```

3. **Get API Keys:**
   - **WAQI**: https://aqicn.org/data-platform/token/
   - **OpenWeatherMap**: https://openweathermap.org/api
   - **Google**: https://console.cloud.google.com/
   - **Mapbox**: https://www.mapbox.com/

4. **Apply database migration** (for location API preferences):
   ```bash
   npm run db:migrate
   # OR manually run: migrations/add_location_api_provider.sql
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

### Test Air Quality APIs

Search for different locations and check server console:

```bash
🔍 Multi-source AQI fetch for lat: 28.6139, lon: 77.2090
  1️⃣ Trying WAQI... API Key: YES
  ✅ WAQI SUCCESS!
  🌐 Source: WAQI/aqicn.org (Government Station)
  📈 AQI: 156
```

### Test Location APIs

1. Login to the app
2. Go to Settings
3. You should see green checkmarks ✅ next to configured providers
4. Select a provider and save
5. Try a location search
6. Check server console - you'll see which provider was used

### Troubleshooting

**Air Quality Data Not Loading?**
- Check server console logs for error details
- Verify API keys in `.env` file
- At minimum, Open-Meteo should work without any keys
- See detailed troubleshooting in `API_INTEGRATION_GUIDE.md`

**Provider shows red X?**
- API key not in `.env` file
- Server not restarted after adding key

**Location searches fail?**
- Check server logs for error details
- Verify API key is valid
- Check API quota/limits

**Need help?**
- **Air Quality APIs**: See `API_INTEGRATION_GUIDE.md`
- **Location APIs**: See `LOCATION_API_GUIDE.md`
- **Full Implementation**: See `IMPLEMENTATION_SUMMARY.md`
- **Multi-source details**: See `AQICN_INTEGRATION.md`

---

## Technical Quick Reference

### Location Service API

```typescript
import { geocodeLocation } from './server/locationService';

// Basic usage
const location = await geocodeLocation('New York');

// With preferred provider
const location = await geocodeLocation('London', 'google');

// Disable fallback
const location = await geocodeLocation('Paris', 'mapbox', false);
```

### Response Format

```typescript
{
  lat: 40.7128,
  lon: -74.0060,
  name: "New York, NY",
  displayName: "New York, United States",
  address: {
    city: "New York",
    state: "New York",
    country: "United States"
  }
}
```

### HTTP Endpoints

```bash
# Get available providers
GET /api/user/location-providers

# Update user preference
PATCH /api/user/settings
Content-Type: application/json
{ "locationApiProvider": "nominatim" }

# Get current user (includes preference)
GET /api/user
```

---

**Need more details?** See `LOCATION_API_GUIDE.md`
