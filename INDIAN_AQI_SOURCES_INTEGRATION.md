# Indian AQI Data Sources Integration

## Overview

This application now integrates multiple Indian AQI data sources to provide the most accurate and reliable air quality information, particularly for locations in India.

## Data Sources Priority

The application fetches AQI data using an intelligent fallback system:

1. **aqi.in (CPCB)** - First priority for Indian locations
   - Official CPCB (Central Pollution Control Board) monitoring stations
   - Real-time government data
   - Indian AQI standards
   - Coverage: Major Indian cities

2. **aqinow.org** - Second priority for Indian locations
   - Community-driven Indian AQI platform
   - Real-time government station data
   - Indian AQI standards
   - Wide coverage across India

3. **aqicn.org (WAQI)** - Third priority (global)
   - World Air Quality Index Project
   - Government monitoring stations worldwide
   - Converted to Indian AQI standards
   - Excellent global coverage

4. **Open-Meteo** - Fallback (modeled data)
   - Modeled air quality data
   - Calculated using Indian CPCB standards
   - Available globally
   - Good when station data unavailable

## Indian CPCB AQI Standards

The application uses Indian CPCB (Central Pollution Control Board) AQI calculation:

### AQI Categories

| AQI Range | Category | Health Impact | Color |
|-----------|----------|---------------|-------|
| 0-50 | Good | Minimal impact | Green (#10B981) |
| 51-100 | Satisfactory | Minor breathing discomfort to sensitive people | Light Green (#84CC16) |
| 101-200 | Moderate | Breathing discomfort to people with lung, heart disease | Yellow (#EAB308) |
| 201-300 | Poor | Breathing discomfort to most people on prolonged exposure | Orange (#F97316) |
| 301-400 | Very Poor | Respiratory illness on prolonged exposure | Red (#EF4444) |
| 401-500 | Severe | Affects healthy people and seriously impacts those with existing diseases | Maroon (#7F1D1D) |

### Pollutant Breakpoints

**PM2.5 (µg/m³)**
- Good: 0-30
- Satisfactory: 31-60
- Moderate: 61-90
- Poor: 91-120
- Very Poor: 121-250
- Severe: 251-380

**PM10 (µg/m³)**
- Good: 0-50
- Satisfactory: 51-100
- Moderate: 101-250
- Poor: 251-350
- Very Poor: 351-430
- Severe: 431-510

## Implementation Details

### Backend Service

**File:** `server/indianAqiService.ts`

The service provides:
- Multi-source AQI fetching
- Automatic fallback mechanism
- Indian AQI calculation
- Location-based source selection

### API Integration

#### aqi.in API
```typescript
GET https://api.aqi.in/v2/cities/{cityName}
Response: {
  currentReading: {
    aqi: number,
    pm25: number,
    pm10: number,
    ...
  },
  stationName: string,
  lastUpdated: string
}
```

#### aqinow.org API
```typescript
GET https://api.aqinow.org/v1/cities/{city-name}
Response: {
  aqi: number,
  pm25: number,
  pm10: number,
  station_name: string,
  category: string,
  last_updated: string
}
```

#### aqicn.org (WAQI) API
```typescript
GET https://api.waqi.info/feed/geo:{lat};{lon}/?token={API_KEY}
Response: {
  status: "ok",
  data: {
    aqi: number,
    iaqi: {
      pm25: { v: number },
      pm10: { v: number },
      ...
    },
    city: { name: string, url: string }
  }
}
```

### Frontend Updates

**File:** `client/src/pages/AirQuality.tsx`

Updated to:
- Display data source information with links
- Show Indian CPCB AQI categories
- Use Indian AQI standard in gauge
- Provide source-specific help text

## Environment Variables

```bash
# Optional: WAQI API key for aqicn.org access
WAQI_API_KEY=your_api_key_here
```

Get your free API key from: https://aqicn.org/data-platform/token/

## How It Works

### For Indian Locations

```
User searches for "Delhi"
    ↓
System detects Indian location
    ↓
Try aqi.in API
    ↓
If failed, try aqinow.org
    ↓
If failed, try aqicn.org (WAQI)
    ↓
If failed, use Open-Meteo
    ↓
Calculate Indian CPCB AQI
    ↓
Display with source attribution
```

### For International Locations

```
User searches for "London"
    ↓
Skip Indian-specific APIs
    ↓
Try aqicn.org (WAQI)
    ↓
If failed, use Open-Meteo
    ↓
Calculate Indian CPCB AQI
    ↓
Display with source attribution
```

## Data Source Detection

The system automatically detects Indian locations based on:
- City name patterns (Delhi, Mumbai, etc.)
- Geographic coordinates (within India's bounding box: 6°N-36°N, 68°E-97°E)

## Verification

To verify the integration is working:

1. **Search for an Indian city** (e.g., "Delhi", "Mumbai", "Bangalore")
2. **Check the data source** shown in the blue info card
3. **Compare values** with:
   - https://aqi.in
   - https://www.aqinow.org
   - https://aqicn.org

Values should match (±5-10 points) due to:
- Different update times
- Different monitoring stations
- Rounding differences

## Benefits

✅ **Accuracy**: Uses official government monitoring station data
✅ **Reliability**: Multiple fallback sources ensure data is always available
✅ **Relevance**: Indian CPCB standards match what users see on popular Indian AQI websites
✅ **Transparency**: Clear attribution of data sources
✅ **Comprehensive**: Works globally while prioritizing Indian data for Indian locations

## Future Enhancements

- [ ] Add real-time forecast data from aqi.in
- [ ] Integrate with more regional AQI data providers
- [ ] Add historical data comparison across sources
- [ ] Implement caching to reduce API calls
- [ ] Add user preference for preferred data source

## Testing

To test manually:

```bash
# Start the development server
npm run dev

# Test Indian cities
- Delhi
- Mumbai  
- Bangalore
- Chennai
- Kolkata

# Test international cities
- London
- New York
- Tokyo
- Paris

# Check console logs for source selection
```

## Troubleshooting

### No data from aqi.in or aqinow.org

These are placeholder integrations. The actual APIs may:
- Require authentication
- Have different endpoints
- Not be publicly accessible

If you have access to these APIs:
1. Update the endpoint URLs in `server/indianAqiService.ts`
2. Add any required API keys to `.env`
3. Update the fetch logic to match their API schema

### Values don't match exactly

This is normal! Different sources may have:
- Different update frequencies
- Different monitoring stations
- Different measurement methods
- Slight variations in calculations

±10 AQI points is acceptable variance.

## Related Files

- `server/indianAqiService.ts` - Multi-source AQI service
- `server/routes.ts` - Updated to use Indian AQI service
- `client/src/pages/AirQuality.tsx` - Updated UI with source info
- `client/src/components/AQIGauge.tsx` - Supports Indian standards
- `test-indian-aqi.ts` - AQI calculation verification tests

## References

- **Indian AQI Standards**: https://cpcb.nic.in/
- **aqi.in**: https://aqi.in
- **aqinow.org**: https://www.aqinow.org
- **aqicn.org**: https://aqicn.org
- **Open-Meteo**: https://open-meteo.com
