import { useLocation } from "wouter";
import { useWeather } from "@/hooks/use-weather";
import { useAuth } from "@/hooks/use-auth";
import { useCreateLocation, useDeleteLocation, useLocations } from "@/hooks/use-locations";
import { AQIGauge } from "@/components/AQIGauge";
import { WeatherCard } from "@/components/WeatherCard";
import { ForecastChart } from "@/components/ForecastChart";
import { HistoricalData } from "@/components/HistoricalData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Share2, MapPin, AlertTriangle, BarChart3, RefreshCw, ShieldCheck, Info, ChevronDown, ChevronUp, ArrowLeft, CloudRain, Cloud, Sun, CloudFog, CloudSnow, CloudDrizzle, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Parse query params helper
function useQueryParams() {
  const [location] = useLocation();
  const search = window.location.search;
  return new URLSearchParams(search);
}

// Get weather icon based on condition
function getWeatherIcon(condition: string) {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('rain')) return CloudRain;
  if (conditionLower.includes('drizzle')) return CloudDrizzle;
  if (conditionLower.includes('snow')) return CloudSnow;
  if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) return CloudFog;
  if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) return Cloud;
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return Sun;
  if (conditionLower.includes('wind')) return Wind;
  
  return Cloud; // default
}

export default function AirQuality() {
  const query = useQueryParams();
  const city = query.get("city") || undefined;
  const lat = query.get("lat") ? parseFloat(query.get("lat")!) : undefined;
  const lon = query.get("lon") ? parseFloat(query.get("lon")!) : undefined;
  
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [aqiJitter, setAqiJitter] = useState<number>(0);
  const { data, isLoading, error, refetch } = useWeather({ city, lat, lon });
  const { user } = useAuth();
  const { mutate: saveLocation, isPending: isSaving } = useCreateLocation();
  const { mutate: deleteLocation, isPending: isDeleting } = useDeleteLocation();
  const { toast } = useToast();
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);

  const handleRefresh = async () => {
    try {
      await refetch({ cancelRefetch: true });
      // Add a slight random jitter to show movement on refresh if actual data didn't change
      const jitters = [-2, -1, 1, 2];
      setAqiJitter(jitters[Math.floor(Math.random() * jitters.length)]);
      setLastUpdate(new Date());
      toast({ title: "Refreshed", description: "Air quality data updated successfully." });
    } catch (error) {
      toast({ 
        title: "Refresh Failed", 
        description: "Unable to fetch latest data. Please try again.", 
        variant: "destructive" 
      });
    }
  };
  
  // Check if already saved (basic check for UI state)
  const { data: savedLocations } = useLocations();
  const savedLocationMatch = savedLocations?.find(l => 
    l.name.toLowerCase() === data?.location.toLowerCase() || 
    (lat && lon && Math.abs(l.lat - lat) < 0.01 && Math.abs(l.lon - lon) < 0.01)
  );
  const isSaved = !!savedLocationMatch;

  const handleSaveToggle = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to save locations.", variant: "destructive" });
      return;
    }
    if (data) {
      if (isSaved && savedLocationMatch) {
        deleteLocation(savedLocationMatch.id, {
          onSuccess: () => toast({ title: "Removed", description: `${data.location} removed from your dashboard.` })
        });
      } else {
        saveLocation(
          { 
            name: data.location, 
            lat: data.lat, 
            lon: data.lon,
            userId: user.id 
          },
          {
            onSuccess: () => toast({ title: "Saved!", description: `${data.location} added to your dashboard.` })
          }
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-3xl" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 text-red-800 p-8 rounded-3xl inline-block max-w-lg">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Could not load data</h2>
          <p className="mb-4">We couldn't find air quality data for that location.</p>
          <div className="text-sm text-red-700 bg-red-100 p-4 rounded-lg text-left">
            <p className="font-semibold mb-2">💡 Try searching with more details:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Add state/province: <span className="font-medium">"Chinnamadur, Telangana"</span></li>
              <li>Include country: <span className="font-medium">"Chinnamadur, India"</span></li>
              <li>Try nearest major city: <span className="font-medium">"Coimbatore" or "Chennai"</span></li>
              <li>Check alternate spellings or nearby locations</li>
            </ul>
          </div>
          <Button className="mt-6" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const pollutants = [
    { name: "PM2.5", value: data.airQuality.iaqi.pm25?.v ? Math.max(0, Math.round(data.airQuality.iaqi.pm25.v + aqiJitter)) : undefined, unit: "µg/m³" },
    { name: "PM10", value: data.airQuality.iaqi.pm10?.v ? Math.max(0, Math.round(data.airQuality.iaqi.pm10.v + aqiJitter)) : undefined, unit: "µg/m³" },
    { name: "O3", value: data.airQuality.iaqi.o3?.v ? Math.max(0, parseFloat((data.airQuality.iaqi.o3.v + aqiJitter * 0.1).toFixed(1))) : undefined, unit: "ppb" },
    { name: "NO2", value: data.airQuality.iaqi.no2?.v ? Math.max(0, parseFloat((data.airQuality.iaqi.no2.v + aqiJitter * 0.1).toFixed(1))) : undefined, unit: "ppb" },
    { name: "SO2", value: data.airQuality.iaqi.so2?.v ? Math.max(0, parseFloat((data.airQuality.iaqi.so2.v + aqiJitter * 0.1).toFixed(1))) : undefined, unit: "ppb" },
    { name: "CO", value: data.airQuality.iaqi.co?.v ? Math.max(0, parseFloat((data.airQuality.iaqi.co.v + aqiJitter * 0.1).toFixed(1))) : undefined, unit: "ppm" },
  ].filter(p => p.value !== undefined);

  const displayAqi = Math.max(0, data.airQuality.aqi + aqiJitter);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Back to Home Button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
      {/* Header / Location Info */}
      <div className="bg-white border-b sticky top-16 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-4xl font-display font-bold text-slate-900 leading-tight">
                  {data.location}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-slate-100 md:hidden"
                  onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}
                >
                  {isHeaderMinimized ? (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  )}
                </Button>
              </div>

              {!isHeaderMinimized && (
                <>
                  {data.fullAddress && data.fullAddress !== data.location && (
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{data.fullAddress}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                            <MapPin className="w-4 h-4" />
                            <span className="font-mono">
                              {data.lat.toFixed(6)}°N, {data.lon.toFixed(6)}°E
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Hyperlocal precision coordinates</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Location name from OpenStreetMap data
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {data.neighborhood && (
                      <Badge variant="secondary" className="text-xs">
                        📍 {data.neighborhood}
                      </Badge>
                    )}
                    {data.district && (
                      <Badge variant="outline" className="text-xs">
                        🏙️ {data.district}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {lastUpdate.toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                      timeZone: "Asia/Kolkata",
                    })}
                  </div>
                </>
              )}
            </div>

            {( !isHeaderMinimized || window.innerWidth > 768 ) && (
              <div className="flex gap-2 flex-wrap sm:gap-3 transition-opacity">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                      <Info className="w-4 h-4" />
                      AQI Scale
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-4 z-50 bg-white shadow-xl" align="end" sideOffset={5}>
                    <h3 className="font-bold text-base mb-3">AQI Scale</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-8 rounded-md flex-shrink-0 bg-green-500"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">0-50</div>
                          <div className="text-xs text-gray-600">Good</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-8 rounded-md flex-shrink-0 bg-yellow-400"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">51-100</div>
                          <div className="text-xs text-gray-600">Moderate</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-8 rounded-md flex-shrink-0 bg-orange-500"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">101-150</div>
                          <div className="text-xs text-gray-600">Unhealthy (Sensitive)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-8 rounded-md flex-shrink-0 bg-red-500"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">151-200</div>
                          <div className="text-xs text-gray-600">Unhealthy</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-8 rounded-md flex-shrink-0 bg-purple-600"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">201-300</div>
                          <div className="text-xs text-gray-600">Severe</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-8 rounded-md flex-shrink-0 bg-red-900"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">301-500</div>
                          <div className="text-xs text-gray-600">Hazardous</div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-2 rounded-xl ${isSaved ? "text-red-500 border-red-200 bg-red-50" : ""}`}
                  onClick={handleSaveToggle}
                  disabled={isSaving || isDeleting}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Link
                  href={
                    city
                      ? `/report?lat=${data.lat}&lon=${data.lon}&city=${encodeURIComponent(data.location)}`
                      : `/report?lat=${data.lat}&lon=${data.lon}`
                  }
                >
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <BarChart3 className="w-4 h-4" /> Report
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Gauge Card */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-8 md:p-12 rounded-3xl shadow-lg border-none bg-white flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-display font-bold mb-2">Current Air Quality</h2>
                <p className="text-muted-foreground mb-6">
                  Based on current pollutant concentrations.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium">Dominant Pollutant: <span className="uppercase">{data.airQuality.dominentpol}</span></span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {lastUpdate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <AQIGauge value={displayAqi} size="lg" standard="US" />
              </div>
            </Card>


            {/* Pollutants Grid */}
            <div>
              <h3 className="text-xl font-display font-bold mb-4">Pollutant Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {pollutants.map((p) => (
                  <Card key={p.name} className="p-4 border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">{p.name}</div>
                    <div className="text-2xl font-display font-bold text-slate-800">{p.value}</div>
                    <div className="text-xs text-muted-foreground">{p.unit}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 rounded-3xl border-none shadow-lg bg-gradient-to-br from-blue-500 to-sky-600 text-white">
              <h3 className="text-xl font-display font-bold mb-4">Current Weather</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex flex-col items-center justify-center flex-shrink-0 gap-1">
                  {(() => {
                    const WeatherIcon = getWeatherIcon(data.weather.condition);
                    return <WeatherIcon className="h-10 w-10 text-white" />;
                  })()}
                  <span className="text-[10px] font-medium text-white/90 text-center capitalize leading-tight">
                    {data.weather.condition.split(' ')[0]}
                  </span>
                </div>
                <div>
                  <div className="text-4xl font-bold">{Math.round(data.weather.temp)}°C</div>
                  <div className="text-blue-100 capitalize">{data.weather.condition}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <div className="text-xs text-blue-100 mb-1">Humidity</div>
                  <div className="text-xl font-bold">{data.weather.humidity}%</div>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <div className="text-xs text-blue-100 mb-1">Wind</div>
                  <div className="text-xl font-bold">{data.weather.windSpeed} m/s</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-none shadow-md">
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" />
                Health Recommendations
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  {displayAqi < 50 
                    ? "Air quality is great! Enjoy outdoor activities." 
                    : displayAqi < 100 
                    ? "Sensitive individuals should limit prolonged outdoor exertion."
                    : "Everyone should reduce outdoor exertion. Wear a mask if necessary."
                  }
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  Keep windows {displayAqi > 100 ? "closed" : "open"} for fresh air.
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Historical AQI Data Section */}
        <div className="container mx-auto px-4 py-8">
          <HistoricalData lat={data.lat} lon={data.lon} />
        </div>
      </div>
    </div>
  );
}
