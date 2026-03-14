from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from db import get_aqi_history, get_aqi_history_by_location
from prophet_forecast import run_prophet_forecast
from arima_forecast import run_arima_forecast

app = FastAPI(title="AirVision Forecast API", version="1.0")

# Allow frontend/backend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to localhost later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "AirVision Forecast API running ✅"}

@app.get("/forecast/prophet")
def forecast_prophet(
    hours: int = Query(default=72, ge=1, le=72),
    limit: int = 500,
    lat: float = Query(default=None, description="Latitude for location-specific forecast"),
    lon: float = Query(default=None, description="Longitude for location-specific forecast"),
    predict_past: bool = Query(default=False, description="Include past predictions"),
    predict_current: bool = Query(default=False, description="Include current prediction")
):
    # Get location-specific AQI history if lat/lon provided, otherwise get global history
    if lat is not None and lon is not None:
        df = get_aqi_history_by_location(lat=lat, lon=lon, limit=limit)
    else:
        df = get_aqi_history(limit=limit)
    
    if df.empty:
        return {"error": "No AQI history found for this location. Save some AQI values first."}

    forecast = run_prophet_forecast(df, hours=hours, predict_past=predict_past, predict_current=predict_current)
    return {"model": "prophet", "hours": hours, "lat": lat, "lon": lon, "predict_past": predict_past, "predict_current": predict_current, "forecast": forecast}

@app.get("/forecast/arima")
def forecast_arima(
    hours: int = Query(default=72, ge=1, le=72),
    limit: int = 500,
    lat: float = Query(default=None, description="Latitude for location-specific forecast"),
    lon: float = Query(default=None, description="Longitude for location-specific forecast"),
    predict_past: bool = Query(default=False, description="Include past predictions"),
    predict_current: bool = Query(default=False, description="Include current prediction")
):
    # Get location-specific AQI history if lat/lon provided, otherwise get global history
    if lat is not None and lon is not None:
        df = get_aqi_history_by_location(lat=lat, lon=lon, limit=limit)
    else:
        df = get_aqi_history(limit=limit)
    
    if df.empty:
        return {"error": "No AQI history found for this location. Save some AQI values first."}

    forecast = run_arima_forecast(df, hours=hours, predict_past=predict_past, predict_current=predict_current)
    return {"model": "arima", "hours": hours, "lat": lat, "lon": lon, "predict_past": predict_past, "predict_current": predict_current, "forecast": forecast}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
