from prophet import Prophet
import pandas as pd

def run_prophet_forecast(df, hours: int = 72, predict_past: bool = False, predict_current: bool = False):
    """
    df columns: recorded_at, aqi
    returns list[{time, aqi}]
    predict_past: if True, generates predictions for past periods using the model
    predict_current: if True, includes current prediction
    """
    try:
        # Prophet requires ds/y format
        data = df.rename(columns={"recorded_at": "ds", "aqi": "y"})

        # Ensure no duplicate timestamps and sort
        data = data.drop_duplicates(subset=['ds']).sort_values('ds')

        model = Prophet(daily_seasonality=True, yearly_seasonality=False, weekly_seasonality=False)
        model.fit(data)

        last_time = df["recorded_at"].iloc[-1]
        forecast = []

        if predict_past:
            # For past predictions, use the model's fitted values on historical data
            past_hours = min(hours, len(data) - 10)  # Leave some data for training
            if past_hours > 0:
                # Get predictions for the last past_hours points in history
                historical_predictions = model.predict(data)
                past_predictions = historical_predictions.tail(past_hours)
                for _, row in past_predictions.iterrows():
                    forecast.append({"time": row["ds"].isoformat(), "aqi": float(row["yhat"])})

        if predict_current:
            # Predict current/next hour
            current_time = last_time + pd.Timedelta(hours=1)
            current_df = pd.DataFrame({'ds': [current_time]})
            current_forecast = model.predict(current_df)
            forecast.append({"time": current_forecast.iloc[0]["ds"].isoformat(), "aqi": float(current_forecast.iloc[0]["yhat"])})

        # Future predictions
        future = model.make_future_dataframe(periods=hours, freq="H")
        future_forecast = model.predict(future)

        result = future_forecast[["ds", "yhat"]].tail(hours)
        for _, row in result.iterrows():
            forecast.append({"time": row["ds"].isoformat(), "aqi": float(row["yhat"])})

        return forecast
    except Exception as e:
        # Fallback to simple average if Prophet fails
        print(f"Prophet failed: {e}, using fallback")
        avg = float(df["aqi"].mean()) if len(df) > 0 else 50.0
        last_time = df["recorded_at"].iloc[-1] if len(df) > 0 else pd.Timestamp.now()
        forecast = []
        if predict_current:
            forecast.append({"time": str(last_time + pd.Timedelta(hours=1)), "aqi": avg})
        for i in range(hours):
            t = last_time + pd.Timedelta(hours=i + 1)
            forecast.append({"time": str(t), "aqi": avg})
        return forecast
