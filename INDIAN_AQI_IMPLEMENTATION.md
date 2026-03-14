# Indian AQI (CPCB) Implementation

## Overview

The application now calculates AQI values using **Indian CPCB (Central Pollution Control Board) standards**, which matches the AQI values displayed on:
- **aqi.in**
- **aqinow.org**
- **indiaaqi.com**

## Key Changes

### 1. Indian AQI Calculation Formula

The application now uses CPCB breakpoints for all major pollutants:

#### PM2.5 Breakpoints (24-hour avg, µg/m³)
| Concentration Range | AQI Range | Category |
|---------------------|-----------|----------|
| 0-30                | 0-50      | Good |
| 31-60               | 51-100    | Satisfactory |
| 61-90               | 101-200   | Moderate |
| 91-120              | 201-300   | Poor |
| 121-250             | 301-400   | Very Poor |
| 251-380             | 401-500   | Severe |

#### PM10 Breakpoints (24-hour avg, µg/m³)
| Concentration Range | AQI Range | Category |
|---------------------|-----------|----------|
| 0-50                | 0-50      | Good |
| 51-100              | 51-100    | Satisfactory |
| 101-250             | 101-200   | Moderate |
| 251-350             | 201-300   | Poor |
| 351-430             | 301-400   | Very Poor |
| 431-510             | 401-500   | Severe |

Also includes breakpoints for O3, NO2, SO2, and CO.

### 2. Data Source

**Primary Source:** WAQI API (aqicn.org)
- Uses real government monitoring station data
- Same data source as aqicn.org and waqi.info
- **However:** WAQI provides pollutant concentrations, not AQI values
- We calculate Indian AQI from these concentrations

**Fallback Source:** Open-Meteo
- Modeled air quality data
- We calculate Indian AQI from pollutant concentrations

## Difference Between US EPA and Indian CPCB AQI

### Example: PM2.5 = 60 µg/m³

**US EPA AQI:**
- Breakpoint: 55.5-150.4 µg/m³ → AQI 151-200 (Unhealthy)
- Calculated AQI: ~154

**Indian CPCB AQI:**
- Breakpoint: 31-60 µg/m³ → AQI 51-100 (Satisfactory)
- Calculated AQI: ~100

**This is why WAQI (US EPA) shows higher AQI values than Indian websites!**

## How to Verify

### Test with Delhi

1. **Search for "Delhi" in the app**
2. **Compare with:**
   - https://aqi.in/dashboard/india/delhi/new-delhi
   - https://www.aqinow.org/city/india/delhi/
   - https://www.indiaaqi.com/2024/12/real-time-air-quality-index-aqi.html

3. **The AQI values should now match!**

### Check the Console Logs

When fetching data, you'll see:
```
Station: Delhi, India
US EPA AQI: 154 → Indian CPCB AQI: 100
PM2.5: 60 µg/m³ | PM10: 85 µg/m³
Source: aqicn.org
```

## Technical Implementation

### Function: `calculateIndianAQI()`

```typescript
function calculateIndianAQI(
  pm25: number,
  pm10: number,
  o3: number = 0,
  no2: number = 0,
  so2: number = 0,
  co: number = 0
): number
```

**Algorithm:**
1. Calculate sub-index for each pollutant using CPCB breakpoints
2. Return the maximum sub-index (most restrictive pollutant)
3. This matches the official CPCB calculation method

### Data Flow

```
WAQI API → Pollutant Concentrations → Indian AQI Calculation → Display
   ↓                                           ↓
Station Data                            CPCB Breakpoints
(aqicn.org)                             (aqi.in standard)
```

## Updated Data Source Labels

- **With WAQI:** "WAQI/aqicn.org (Indian AQI)"
- **With Open-Meteo:** "Open-Meteo (Indian AQI)"

This clearly indicates we're using Indian AQI standards, not US EPA.

## Benefits

✅ **Accurate for Indian Users:** Matches government CPCB standards
✅ **Consistent with Popular Sites:** Same values as aqi.in, aqinow.org, indiaaqi.com
✅ **Better Context:** Indian breakpoints are more relevant for Indian air quality conditions
✅ **Transparent:** Clearly labeled as "Indian AQI" in the UI

## Testing Recommendations

### Major Cities to Test

1. **Delhi** - Usually high pollution
2. **Hyderabad** - Moderate pollution
3. **Bangalore** - Generally better air quality
4. **Mumbai** - Coastal city
5. **Chennai** - Southern metro

### What to Check

- AQI value matches reference websites (±5 points acceptable due to timing)
- Dominant pollutant is correct (usually PM2.5 or PM10 in India)
- Data source shows "Indian AQI"
- Console logs show conversion from US EPA to Indian AQI

## Future Enhancements

Possible additions:
- Toggle between US EPA and Indian CPCB AQI in settings
- Show both AQI standards side-by-side
- Display individual pollutant sub-indices
- Add health recommendations based on Indian AQI categories

## References

- **CPCB Official:** https://cpcb.nic.in/
- **Indian AQI Standards:** https://app.cpcbccr.com/ccr_docs/FINAL-REPORT_AQI_.pdf
- **AQI.in:** https://aqi.in/
- **WAQI Project:** https://aqicn.org/
