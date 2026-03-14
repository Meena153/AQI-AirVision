# Multi-Location API Provider Support

## Overview

The AirVision application now supports multiple location API providers, allowing users to choose their preferred geocoding service. This feature enables flexible, reliable location searches with automatic fallback support.

## Supported Providers

### 1. **Nominatim (OpenStreetMap)** 
- **Default provider**
- **API Key Required:** No
- **Free tier:** Unlimited (with fair use policy)
- **Best for:** General use, neighborhoods, addresses
- **Advantages:** Free, open-source, hyperlocal support
- **Limitations:** Rate limited, may be slower than commercial APIs

### 2. **OpenWeatherMap**
- **API Key Required:** Yes (`OPENWEATHERMAP_API_KEY`)
- **Free tier:** 60 calls/minute, 1M calls/month
- **Best for:** Weather-integrated location searches
- **Advantages:** Reliable, includes weather data
- **Limitations:** Requires API key, free tier limits

### 3. **Google Geocoding API**
- **API Key Required:** Yes (`GOOGLE_GEOCODING_API_KEY`)
- **Free tier:** $200 credit monthly
- **Best for:** High accuracy requirements, global coverage
- **Advantages:** Excellent accuracy, comprehensive address details
- **Limitations:** Paid service after free tier

### 4. **Mapbox Geocoding**
- **API Key Required:** Yes (`MAPBOX_API_KEY`)
- **Free tier:** 100,000 requests/month
- **Best for:** Fast searches, interactive applications
- **Advantages:** Fast, accurate, good address parsing
- **Limitations:** Requires API key

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Optional - only configure the providers you want to use
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here
GOOGLE_GEOCODING_API_KEY=your_google_api_key_here
MAPBOX_API_KEY=your_mapbox_api_key_here
```

### Getting API Keys

#### OpenWeatherMap
1. Visit https://openweathermap.org/api
2. Sign up for a free account
3. Navigate to API keys section
4. Generate a new API key

#### Google Geocoding
1. Visit https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Geocoding API"
4. Create credentials (API key)
5. Restrict the key to Geocoding API

#### Mapbox
1. Visit https://www.mapbox.com/
2. Sign up for an account
3. Navigate to Account → Tokens
4. Create a new access token

## Usage

### For Users

1. **Login** to your account
2. Click on your **profile avatar** in the navigation
3. Select **Settings** from the dropdown
4. Under **Location API Provider**, select your preferred provider
5. Click **Save Changes**

The system will:
- Use your preferred provider first for all location searches
- Automatically fall back to other available providers if the primary fails
- Display which providers are available (green checkmark) vs. require configuration (red X)

### For Developers

#### Using the Location Service

```typescript
import { geocodeLocation } from './server/locationService';

// Use default provider (Nominatim)
const result = await geocodeLocation('New York, NY');

// Use specific provider
const result = await geocodeLocation('London, UK', 'google', true);

// Disable fallback
const result = await geocodeLocation('Paris, France', 'mapbox', false);
```

#### API Response Structure

```typescript
interface LocationResult {
  lat: number;
  lon: number;
  name: string;
  displayName?: string;
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}
```

## API Endpoints

### Get Available Providers
```
GET /api/user/location-providers
```

**Response:**
```json
[
  {
    "provider": "nominatim",
    "name": "OpenStreetMap Nominatim",
    "available": true
  },
  {
    "provider": "openweather",
    "name": "OpenWeatherMap",
    "available": false
  }
]
```

### Update User Settings
```
PATCH /api/user/settings
Content-Type: application/json

{
  "locationApiProvider": "nominatim"
}
```

**Response:**
```json
{
  "message": "Settings updated successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "locationApiProvider": "nominatim"
  }
}
```

## Architecture

### Components

1. **Location Service** (`server/locationService.ts`)
   - Handles all geocoding logic
   - Supports multiple providers
   - Implements fallback mechanism
   - Validates API key availability

2. **User Schema** (`shared/models/auth.ts`)
   - Added `locationApiProvider` field
   - Stores user preference

3. **Settings Page** (`client/src/pages/Settings.tsx`)
   - UI for selecting provider
   - Shows available vs. unavailable providers
   - Configuration instructions

4. **API Routes** (`server/routes.ts`)
   - User settings endpoints
   - Provider availability endpoint
   - Updated geocoding to use user preference

### Fallback Strategy

When a location search is performed:

1. **Primary**: Use user's preferred provider
2. **Fallback 1**: Try next available provider (with API key)
3. **Fallback 2**: Continue through all configured providers
4. **Final**: Return error if all providers fail

This ensures maximum reliability while respecting user preferences.

## Database Migration

The migration file is located at `migrations/add_location_api_provider.sql`

To apply manually:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_api_provider VARCHAR DEFAULT 'nominatim';
```

Or use your migration tool:
```bash
npm run db:migrate
```

## Testing

### Testing Different Providers

1. Configure API keys in `.env`
2. Restart the server
3. Login and change provider in Settings
4. Perform location searches
5. Check server logs to see which provider was used

### Server Logs

The location service logs detailed information:
```
🔍 Geocoding "New York, NY" with provider: google
Trying Google Geocoding API with: "New York, NY"
✓ Success with Google Geocoding API: New York, NY (40.7128, -74.0060)
```

## Troubleshooting

### Provider Not Available

**Symptom:** Red X next to provider in Settings

**Solution:** 
- Ensure API key is added to `.env`
- Restart the server after adding keys
- Verify API key is valid

### All Searches Fail

**Symptom:** "Location not found" error

**Possible causes:**
1. No providers configured (not even Nominatim)
2. Network connectivity issues
3. All API keys invalid or rate limited

**Solution:**
- Check server logs for detailed error messages
- Verify at least Nominatim is working (no key required)
- Check API key validity and quotas

### Rate Limiting

**Symptom:** Searches work initially, then fail

**Solution:**
- Upgrade to paid tier
- Switch to different provider
- Implement caching (future enhancement)

## Future Enhancements

- [ ] Location search result caching
- [ ] Analytics on provider performance
- [ ] Auto-switching based on location type
- [ ] Custom provider configuration per organization
- [ ] Batch geocoding support

## License & Attribution

- Nominatim: Open Database License (ODbL)
- OpenWeatherMap: Proprietary (free tier available)
- Google Geocoding: Proprietary (paid service)
- Mapbox: Proprietary (free tier available)

Always comply with the terms of service for each provider you use.
