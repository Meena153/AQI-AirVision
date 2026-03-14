import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load environment variables from ../.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("❌ DATABASE_URL not found. Add it in .env (same as your Node project).")

engine = create_engine(DATABASE_URL)

def get_aqi_history(limit: int = 500):
    """
    Fetch AQI time-series history.
    Expects aqi_history table with recorded_at and aqi columns.
    """
    query = f"""
        SELECT recorded_at, aqi
        FROM aqi_history
        WHERE aqi IS NOT NULL
        ORDER BY recorded_at ASC
        LIMIT {limit};
    """

    df = pd.read_sql(query, engine)

    if df.empty:
        return df

    df["recorded_at"] = pd.to_datetime(df["recorded_at"])
    df["aqi"] = pd.to_numeric(df["aqi"], errors="coerce").fillna(0)

    return df

def get_aqi_history_by_location(lat: float, lon: float, limit: int = 500):
    """
    Fetch AQI time-series history for a specific location.
    Finds nearby locations within a small radius (~5km) and returns their data.
    """
    # Calculate approximate lat/lon bounds (~0.05 degrees ~ 5km)
    lat_delta = 0.05
    lon_delta = 0.05
    
    query = f"""
        SELECT h.recorded_at, h.aqi
        FROM aqi_history h
        JOIN saved_locations sl ON h.location_id = sl.id
        WHERE h.aqi IS NOT NULL 
        AND sl.lat BETWEEN {lat - lat_delta} AND {lat + lat_delta}
        AND sl.lon BETWEEN {lon - lon_delta} AND {lon + lon_delta}
        ORDER BY h.recorded_at ASC
        LIMIT {limit};
    """
    
    try:
        df = pd.read_sql(query, engine)
    except Exception as e:
        print(f"Location-based query failed: {e}. Falling back to global history.")
        return get_aqi_history(limit=limit)

    if df.empty:
        # If no location-specific data found, return global history as fallback
        print(f"No AQI history found for location ({lat}, {lon}). Using global history as fallback.")
        return get_aqi_history(limit=limit)

    df["recorded_at"] = pd.to_datetime(df["recorded_at"])
    df["aqi"] = pd.to_numeric(df["aqi"], errors="coerce").fillna(0)

    return df
