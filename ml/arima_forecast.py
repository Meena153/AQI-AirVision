import numpy as np
from statsmodels.tsa.arima.model import ARIMA
import pandas as pd

def run_arima_forecast(df, hours: int = 72, predict_past: bool = False, predict_current: bool = False):
    """
    df columns: recorded_at, aqi
    returns list[{time, aqi}]
    predict_past: if True, generates predictions for past periods using the model
    predict_current: if True, includes current prediction
    """
    series = df["aqi"].astype(float).values

    # If not enough data, fallback to average
    if len(series) < 20:
        avg = float(np.mean(series)) if len(series) else 50.0
        last_time = df["recorded_at"].iloc[-1]
        forecast = []
        if predict_current:
            forecast.append({"time": str(last_time), "aqi": round(avg, 2)})
        for i in range(hours):
            t = last_time + np.timedelta64(i + 1, "h")
            forecast.append({"time": str(t), "aqi": round(avg, 2)})
        return forecast

    # ARIMA model order can be tuned (p,d,q)
    model = ARIMA(series, order=(2, 1, 2))
    fitted = model.fit()

    last_time = df["recorded_at"].iloc[-1]
    forecast = []

    if predict_past:
        # Generate predictions for past periods (backtesting)
        # Use the last N hours of data for past predictions
        past_hours = min(hours, len(series) - 10)  # Leave some data for training
        for i in range(past_hours):
            # For past predictions, we use the model's fitted values
            if i < len(fitted.fittedvalues):
                pred_value = fitted.fittedvalues[-(past_hours - i)]
                t = last_time - np.timedelta64(past_hours - i, "h")
                forecast.append({"time": str(t), "aqi": float(round(pred_value, 2))})

    if predict_current:
        # Predict current value (next immediate prediction)
        current_pred = fitted.forecast(steps=1)[0]
        forecast.append({"time": str(last_time + np.timedelta64(1, "h")), "aqi": float(round(current_pred, 2))})

    # Future predictions
    preds = fitted.forecast(steps=hours)
    for i, val in enumerate(preds):
        t = last_time + np.timedelta64(i + 1, "h")
        forecast.append({"time": str(t), "aqi": float(round(val, 2))})

    return forecast
