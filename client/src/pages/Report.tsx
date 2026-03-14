import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from "@/components/ui/card";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useWeather } from "@/hooks/use-weather";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Info, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Parse query params helper
function useQueryParams() {
  const search = window.location.search;
  return new URLSearchParams(search);
}

// Helper to get AQI color
function getAQIColor(aqi: number) {
  if (aqi <= 50) return "#10b981"; // Good - Green
  if (aqi <= 100) return "#fbbf24"; // Moderate - Yellow
  if (aqi <= 150) return "#f97316"; // Unhealthy for Sensitive - Orange
  if (aqi <= 200) return "#ef4444"; // Unhealthy - Red
  if (aqi <= 300) return "#A855F7"; // Severe - Purple
  return "#7f1d1d"; // Hazardous - Maroon
}

// Helper to get AQI category
function getAQICategory(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Severe";
  return "Hazardous";
}

export default function Report() {
  const query = useQueryParams();
  const city = query.get("city") || undefined;
  const lat = query.get("lat") ? parseFloat(query.get("lat")!) : undefined;
  const lon = query.get("lon") ? parseFloat(query.get("lon")!) : undefined;

  console.log("Report page params:", { city, lat, lon });

  // Check if we have valid parameters
  const hasValidParams = (lat && lon) || city;

  if (!hasValidParams) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          {/* Back to Home Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold mb-4">Air Quality Reports</h1>
            <p className="text-muted-foreground mb-6">View detailed air quality reports for specific locations.</p>
            <p className="text-sm text-muted-foreground">
              To view a report, navigate to a location's air quality page or dashboard and click "View Report".
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useWeather({ city, lat, lon });

  console.log("Report page data:", { data, isLoading, error, hasValidParams });
  const [metric, setMetric] = useState<"aqi">("aqi");

  // Get current AQI from actual monitoring data
  const currentAQI = data?.airQuality?.aqi || 0;

  // Transform forecast data for the chart - blend with current AQI
  const chartData = data?.airQuality?.forecast?.daily?.aqi?.map((item, index) => {
    const forecastValue = item.value;
    // If forecast is significantly lower than current, adjust it proportionally
    // This accounts for Open-Meteo being modeled data vs WAQI being actual station data
    let adjustedAQI = forecastValue;
    
    // Apply a baseline correction if current AQI is higher than forecast average
    if (index === 0 && currentAQI > forecastValue) {
      // For the first few hours, use current AQI or a weighted blend
      adjustedAQI = currentAQI;
    } else if (index < 12 && currentAQI > forecastValue * 1.2) {
      // Gradually blend from current to forecast over 12 hours
      const blendFactor = 1 - (index / 12);
      adjustedAQI = forecastValue + (currentAQI - forecastValue) * blendFactor;
    }
    
    return {
      name: format(parseISO(item.time), "MMM d, HH:mm"),
      fullTime: format(parseISO(item.time), "MMM d, yyyy 'at' HH:mm"),
      aqi: Math.round(adjustedAQI),
      originalForecast: forecastValue,
    };
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          {/* Back to Home Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Skeleton className="h-12 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-96 lg:col-span-2" />
            <div className="space-y-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          {/* Back to Home Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-4 hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold mb-4">Report Not Available</h1>
            <p className="text-muted-foreground mb-4">Unable to load report data for this location.</p>
            <p className="text-sm text-muted-foreground">
              Parameters: city={city}, lat={lat}, lon={lon}
            </p>
            <p className="text-sm text-muted-foreground">
              Error: {error?.message || 'No data available'}
            </p>
            <p className="text-sm text-muted-foreground">
              Make sure you access this page from the Air Quality page or Dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        {/* Back to Home Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-4 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-bold mb-2">Air Quality Report</h1>
        <p className="text-muted-foreground mb-8">72-hour forecast for {data.location}</p>

        {/* Current AQI Summary Card */}
        <div className="mb-8">
          <Card className="p-6 rounded-2xl shadow-lg border-none bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Air Quality</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold" style={{ color: getAQIColor(currentAQI) }}>
                    {currentAQI}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground">AQI</span>
                </div>
                <p className="text-sm mt-2 font-medium" style={{ color: getAQIColor(currentAQI) }}>
                  {getAQICategory(currentAQI)}
                </p>
                {data.airQuality.dataSource && (
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 cursor-help">
                          <Info className="w-3.5 h-3.5" />
                          <span>Data from {data.airQuality.dataSource}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Current AQI from actual government monitoring stations via WAQI/aqicn.org
                        </p>
                        {data.airQuality.stationName && (
                          <p className="text-xs mt-1 font-medium">Station: {data.airQuality.stationName}</p>
                        )}
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Dominant Pollutant</p>
                <Badge variant="secondary" className="text-sm">
                  {data.airQuality.dominentpol?.toUpperCase().replace('PM25', 'PM2.5').replace('PM10', 'PM10') || 'PM2.5'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <Card className="p-8 rounded-3xl shadow-lg border-none bg-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold">72-Hour Forecast</h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Forecast adjusted to align with current monitoring station data
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={metric === "aqi" ? "default" : "outline"}
                  onClick={() => setMetric("aqi")}
                  className="rounded-full"
                >
                  AQI
                </Button>
              </div>
            </div>

            <div className="h-[400px] w-full">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Info className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Forecast data is currently unavailable for this location.</p>
                    <p className="text-xs mt-2">Current AQI: <span className="font-bold" style={{ color: getAQIColor(currentAQI) }}>{currentAQI}</span></p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={getAQIColor(currentAQI)} stopOpacity={0.7}/>
                        <stop offset="100%" stopColor={getAQIColor(currentAQI)} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8'}} 
                      label={{ value: 'AQI', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                      domain={[0, 'auto']}
                      allowDataOverflow={false}
                    />
                    {/* Current AQI reference line */}
                    <ReferenceLine 
                      y={currentAQI} 
                      stroke={getAQIColor(currentAQI)} 
                      strokeDasharray="5 5" 
                      strokeWidth={2}
                      label={{ 
                        value: `Current: ${currentAQI}`, 
                        position: 'right',
                        fill: getAQIColor(currentAQI),
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value: number, name: string, props: any) => {
                        const aqi = Math.round(value);
                        return [
                          <div key="tooltip">
                            <div style={{ color: getAQIColor(aqi), fontWeight: 'bold' }}>
                              {aqi} AQI - {getAQICategory(aqi)}
                            </div>
                            {props.payload.originalForecast !== aqi && (
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                Base forecast: {Math.round(props.payload.originalForecast)}
                              </div>
                            )}
                          </div>,
                          'Air Quality Index'
                        ];
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={metric} 
                      stroke={getAQIColor(currentAQI)} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)"
                      dot={{ fill: getAQIColor(currentAQI), r: 3 }}
                      activeDot={{ fill: getAQIColor(currentAQI), r: 5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-current" style={{ color: getAQIColor(currentAQI) }}></div>
                  <span className="text-muted-foreground">Current AQI baseline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm" style={{ background: `linear-gradient(to bottom, ${getAQIColor(currentAQI)}80, ${getAQIColor(currentAQI)}00)` }}></div>
                  <span className="text-muted-foreground">Forecast trend (adjusted)</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AQI Scale Reference */}
        <Card className="p-6 rounded-2xl shadow-lg border-none bg-white">
          <h3 className="font-semibold mb-4">AQI Scale Reference</h3>
          <div className="space-y-2">
            {[
              { range: "0-50", label: "Good", color: "#10b981" },
              { range: "51-100", label: "Moderate", color: "#fbbf24" },
              { range: "101-150", label: "Unhealthy for Sensitive Groups", color: "#f97316" },
              { range: "151-200", label: "Unhealthy", color: "#ef4444" },
              { range: "201-300", label: "Severe", color: "#9333ea" },
              { range: "300+", label: "Hazardous", color: "#7f1d1d" },
            ].map((item) => (
              <div key={item.range} className="flex items-center gap-2">
                <div className="w-16 h-6 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm font-medium w-20 text-right">{item.range}</span>
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
