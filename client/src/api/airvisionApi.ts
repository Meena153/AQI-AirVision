const API_BASE_URL = '/api'; // Use relative path to proxy through main server on port 3000

export interface ForecastData {
  time: string;
  aqi: number;
}

export interface ForecastResponse {
  model: string;
  hours: number;
  lat?: number;
  lon?: number;
  predict_past: boolean;
  predict_current: boolean;
  forecast: ForecastData[];
}

export async function getProphetForecast(
  hours: number = 72,
  predictPast: boolean = false,
  predictCurrent: boolean = false,
  lat?: number,
  lon?: number
): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    hours: hours.toString(),
    predict_past: predictPast.toString(),
    predict_current: predictCurrent.toString(),
    model: 'prophet', // Add model parameter
  });

  if (lat !== undefined && lon !== undefined) {
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());
  }

  const response = await fetch(`${API_BASE_URL}/forecast?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch prophet forecast: ${response.statusText}`);
  }
  return response.json();
}

export async function getArimaForecast(
  hours: number = 72,
  predictPast: boolean = false,
  predictCurrent: boolean = false,
  lat?: number,
  lon?: number
): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    hours: hours.toString(),
    predict_past: predictPast.toString(),
    predict_current: predictCurrent.toString(),
    model: 'arima', // Add model parameter
  });

  if (lat !== undefined && lon !== undefined) {
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());
  }

  const response = await fetch(`${API_BASE_URL}/forecast?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch arima forecast: ${response.statusText}`);
  }
  return response.json();
}