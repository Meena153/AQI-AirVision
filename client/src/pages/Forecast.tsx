import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ForecastChart } from '@/components/ForecastChart';
import { getProphetForecast, getArimaForecast, ForecastData } from '@/api/airvisionApi';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function Forecast() {
  const [model, setModel] = useState<'prophet' | 'arima'>('prophet');
  const [hours, setHours] = useState(72);
  const [predictPast, setPredictPast] = useState(true);
  const [predictCurrent, setPredictCurrent] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const { toast } = useToast();

  // Get user's current location on mount
  useEffect(() => {
    if (useCurrentLocation && !lat && !lon) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLat(position.coords.latitude);
            setLon(position.coords.longitude);
            setLocationName(`Current Location (${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)})`);
            toast({
              title: 'Location Found',
              description: 'Using your current location for forecast.',
            });
          },
          (error) => {
            toast({
              title: 'Location Error',
              description: 'Unable to access your location. Please enable location permissions.',
              variant: 'destructive',
            });
          }
        );
      } else {
        toast({
          title: 'Geolocation Not Supported',
          description: 'Your browser does not support geolocation.',
          variant: 'destructive',
        });
      }
    }
  }, [useCurrentLocation]);

  const handleFetchForecast = async () => {
    if (!lat || !lon) {
      toast({
        title: 'Location Required',
        description: 'Please enter coordinates or use current location for forecast.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let response;
      if (model === 'prophet') {
        response = await getProphetForecast(hours, predictPast, predictCurrent, lat, lon);
      } else {
        response = await getArimaForecast(hours, predictPast, predictCurrent, lat, lon);
      }
      setForecastData(response.forecast);
      toast({
        title: 'Forecast loaded',
        description: `Loaded ${response.forecast.length} data points using ${model} ${locationName ? `for ${locationName}` : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load forecast',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Back to Home Button */}
      <Link href="/">
        <Button variant="ghost" className="mb-4 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>
      <h1 className="text-3xl font-bold mb-6">Air Quality Forecast</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Forecast Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Location Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Location</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCurrentLocation"
                  checked={useCurrentLocation}
                  onCheckedChange={(checked) => {
                    setUseCurrentLocation(checked as boolean);
                    if (!checked) {
                      setLat(undefined);
                      setLon(undefined);
                      setLocationName('');
                    }
                  }}
                />
                <label htmlFor="useCurrentLocation" className="text-sm font-medium">
                  Use Current Location
                </label>
              </div>

              {!useCurrentLocation && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Latitude</label>
                    <Input
                      type="number"
                      placeholder="e.g., 28.6139"
                      value={lat?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                        setLat(val);
                        if (val && lon) {
                          setLocationName(`${val.toFixed(4)}, ${lon.toFixed(4)}`);
                        }
                      }}
                      step="0.0001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Longitude</label>
                    <Input
                      type="number"
                      placeholder="e.g., 77.209"
                      value={lon?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                        setLon(val);
                        if (lat && val) {
                          setLocationName(`${lat.toFixed(4)}, ${val.toFixed(4)}`);
                        }
                      }}
                      step="0.0001"
                    />
                  </div>
                </div>
              )}

              {locationName && (
                <Alert>
                  <AlertDescription>
                    📍 {locationName}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Model Settings */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Model Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <Select value={model} onValueChange={(value: 'prophet' | 'arima') => setModel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prophet">Prophet</SelectItem>
                    <SelectItem value="arima">ARIMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hours</label>
                <Select value={hours.toString()} onValueChange={(value) => setHours(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="predictPast"
                  checked={predictPast}
                  onCheckedChange={(checked) => setPredictPast(checked as boolean)}
                />
                <label htmlFor="predictPast" className="text-sm font-medium">
                  Include Past Forecast
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-3">
              <Checkbox
                id="predictCurrent"
                checked={predictCurrent}
                onCheckedChange={(checked) => setPredictCurrent(checked as boolean)}
              />
              <label htmlFor="predictCurrent" className="text-sm font-medium">
                Include Current Prediction
              </label>
            </div>
          </div>

          <Button onClick={handleFetchForecast} disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Get Forecast'}
          </Button>
        </CardContent>
      </Card>

      {forecastData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {model.toUpperCase()} Forecast ({predictPast ? 'Past + ' : ''}Future)
              {locationName && <span className="text-sm text-muted-foreground ml-2">for {locationName}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastChart data={forecastData.map(item => ({ value: item.aqi, time: item.time }))} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}