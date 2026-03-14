# AQI Data Sources Configuration Guide

## Overview

Your Air Quality application uses an **intelligent multi-source fallback system** to fetch the most accurate AQI data from reliable global sources.

## Data Source Priority

1. **WAQI/aqicn.org** - First priority ✅
   - World Air Quality Index Project
   - Real government monitoring stations worldwide
   - Automatically converted to Indian AQI standards
   - Status: ✅ Working (requires free API key)

2. **OpenWeatherMap** - Second priority (Recommended for global coverage) 🌍
   - Comprehensive global air pollution data
   - Real-time pollutant concentrations
   - Hourly forecast available
   - Status: ⚠️ Requires API key

3. **Open-Meteo** - Fallback ✅
   - Modeled air quality data
   - Always available, no API key needed
   - Calculated using Indian CPCB standards
   - Status: ✅ Working

## Current Implementation Status

### ✅ Working Sources

**WAQI (aqicn.org)** - Currently providing accurate data
- Uses government monitoring stations
- Automatically converts to Indian CPCB AQI standards
- Provides station names and URLs
- Example for Delhi:
  - Government Station Data → Indian AQI: 344
  - Station: Major Dhyan Chand National Stadium, Delhi

**Open-Meteo** - Always available fallback
- Provides modeled air quality data
- Uses actual pollutant concentrations
- Calculates Indian AQI using CPCB formula

### 🌍 Recommended Addition

**OpenWeatherMap** - Global coverage with excellent data quality
- Covers locations worldwide
- Real-time pollutant measurements (PM2.5, PM10, NO2, SO2, O3, CO)
- Hourly forecast for next 3 days
- Free tier: 1,000 calls/day

## How to Configure Data Sources

### 1. WAQI/aqicn.org (Currently Active)

Already configured! Your `.env` file has:
```env
WAQI_API_KEY=ebc4daf97d33f3080307ce8bdc7e6f5e60f52344
```

To get your own key:
1. Visit https://aqicn.org/data-platform/token/
2. Sign up for a free account
3. Get your API token
4. Update `.env` with your token

### 2. OpenWeatherMap (Recommended - Add This!)

**Step-by-step setup:**

1. **Get API Key:**
   - Go to https://openweathermap.org/api
   - Sign up for a free account
   - Navigate to API keys section
   - Copy your API key

2. **Add to `.env` file:**
   ```env
   OPENWEATHERMAP_API_KEY=your_api_key_here
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

**Free tier includes:**
- 1,000 API calls per day
- Current air pollution data
- 5-day air pollution forecast
- Perfect for development and small-scale production

### 3. Open-Meteo (No Configuration Needed)

Works automatically as fallback. No API key required.

## Understanding AQI Conversions

### Indian CPCB AQI Standards (What We Use)

| AQI Range | Category | PM2.5 (µg/m³) | PM10 (µg/m³) |
|-----------|----------|---------------|--------------|
| 0-50      | Good     | 0-30          | 0-50         |
| 51-100    | Satisfactory | 31-60     | 51-100       |
| 101-200   | Moderate | 61-90         | 101-250      |
| 201-300   | Poor     | 91-120        | 251-350      |
| 301-400   | Very Poor | 121-250      | 351-430      |
| 401-500   | Severe   | 251-380       | 431-510      |

### US EPA AQI (What WAQI Uses)

| AQI Range | Category | PM2.5 (µg/m³) | PM10 (µg/m³) |
|-----------|----------|---------------|--------------|
| 0-50      | Good     | 0-12          | 0-54         |
| 51-100    | Moderate | 12.1-35.4     | 55-154       |
| 101-150   | Unhealthy for Sensitive | 35.5-55.4 | 155-254 |

**Note:** Indian AQI is generally higher than US AQI for the same pollution levels because it uses stricter thresholds.

## Verifying Data Accuracy

### Current Data (Using WAQI)

The WAQI data is accurate and from official government monitoring stations. The conversion to Indian AQI is mathematically correct according to CPCB standards.

**Example for Delhi:**
- WAQI provides: PM2.5 = 177 µg/m³
- Indian CPCB calculation: AQI = 344 (Very Poor)
- This matches the Indian AQI scale where PM2.5 > 121 = Very Poor

### To Verify Against aqi.in or aqinow.org

1. Visit https://aqi.in or https://www.aqinow.org
2. Search for the same city
3. Compare AQI values (they should be similar ±10-20 points)
4. Small differences are normal due to:
   - Different monitoring stations
   - Different update times
   - Slight measurement variations

## API Response Format

All sources return data in this standardized format:

```json
{
  "airQuality": {
    "aqi": 344,
    "city": "Delhi",
    "dominentpol": "pm25",
    "dataSource": "WAQI/aqicn.org (Converted to Indian AQI)",
    "stationName": "Major Dhyan Chand National Stadium, Delhi, Delhi, India",
    "stationUrl": "https://aqicn.org/city/delhi/major-dhyan-chand-national-stadium",
    "iaqi": {
      "pm25": { "v": 177 },
      "pm10": { "v": 147 },
      "o3": { "v": 0.9 },
      "no2": { "v": 66.1 },
      "so2": { "v": 4.4 },
      "co": { "v": 12.7 }
    }
  }
}
```

## Troubleshooting

### "OpenWeatherMap API request failed"

1. Check your API key in `.env` file
2. Verify the key is active (can take a few hours after creation)
3. Check you haven't exceeded the free tier limit (1,000 calls/day)
4. System will automatically fallback to Open-Meteo

### Values Don't Match Exactly

±10-20 AQI point differences are normal due to:
- Different monitoring stations within the same city
- Different data update frequencies
- Slight variations in measurement methods
- Time delays between updates

### No Data Available

The system has multiple fallbacks:
1. If WAQI fails → tries OpenWeatherMap
2. If OpenWeatherMap fails → uses Open-Meteo
3. Open-Meteo always works as final fallback

## Files Modified

1. **server/indianAqiService.ts** (NEW)
   - Multi-source AQI fetching service
   - Indian AQI calculation
   - Intelligent fallback mechanism

2. **server/routes.ts** (UPDATED)
   - Now uses indianAqiService
   - Removed duplicate AQI calculation code
   - Improved logging

3. **All data sources integrated:**UPDATED)
   - Multi-source AQI fetching service
   - Indian AQI calculation
   - Priority: WAQI → OpenWeatherMap → Open-Meteo
   - Removed aqi.in and aqinow.org (not publicly accessible)

2. **server/routes.ts** (UPDATED)
   - Uses indianAqiService for all AQI data
   - Improved logging and error handling

3. **Data sources:**
   - ✅ WAQI (working)
  📡 Trying WAQI API...
  ✅ WAQI SUCCESS! Indian AQI: 344
✅ Using WAQI data

📊 Final Air Quality Data:
  📈 AQI: 344
  🎯 Dominant Pollutant: PM25
  🏢 Station: Major Dhyan Chand National Stadium, Delhi
```

Or with OpenWeatherMap:

```
🔍 Fetching AQI data for: London
  📡 Trying WAQI API...
  ⚠️  WAQI: No data available
  📡 Trying OpenWeatherMap API...
  ✅ OpenWeatherMap SUCCESS! AQI: 78
    PM2.5: 18.5 µg/m³, PM10: 32.1 µg/m³
✅ UAdd OpenWeatherMap API key for better global coverage
3. Verify API keys in `.env` file
4. Check server console logs for detailed error messages
5. Ensure internet connectivity for API calls

## API Limits

### WAQI
- Free tier: No official limit, but be reasonable
- Rate limiting: Not publicly documented

### OpenWeatherMap
- Free tier: 1,000 calls/day
- Rate limiting: 60 calls/minute
- Perfect for small to medium applications

### Open-Meteo
- Free tier: Unlimited
- No API key required
- Always available as fallback

## References

- **Indian AQI Standards**: https://cpcb.nic.in/
- **WAQI Documentation**: https://aqicn.org/api/
- **OpenWeatherMap Air Pollution API**: https://openweathermap.org/api/air-pollution
## References

- **Indian AQI Standards**: https://cpcb.nic.in/
- **WAQI Documentation**: https://aqicn.org/api/
- **aqi.in**: https://aqi.in
- **aqinow.org**: https://www.aqinow.org
- **Open-Meteo**: https://open-meteo.com
