import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Calendar, TrendingDown, TrendingUp, Activity, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface HistoricalDataProps {
  lat: number;
  lon: number;
}

type TimeRange = "24hrs" | "7days" | "30days";

interface HistoricalDataPoint {
  timestamp: string;
  aqi: number;
  locationName: string;
}

interface HistoricalResponse {
  lat: number;
  lon: number;
  timeRange: string;
  hours: number;
  data: HistoricalDataPoint[];
  count: number;
}

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "#10B981";
  if (aqi <= 100) return "#EAB308";
  if (aqi <= 150) return "#F97316";
  if (aqi <= 200) return "#EF4444";
  if (aqi <= 300) return "#A855F7";
  return "#991B1B";
}

function getAQICategory(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Severe";
  return "Hazardous";
}

export function HistoricalData({ lat, lon }: HistoricalDataProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24hrs");
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { data, isLoading, error } = useQuery<HistoricalResponse>({
    queryKey: ["historical-aqi", lat, lon, timeRange, useCustomRange, dateRange],
    queryFn: async () => {
      let url = `/api/historical-aqi?lat=${lat}&lon=${lon}`;
      
      if (useCustomRange && dateRange?.from && dateRange?.to) {
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        url += `&startDate=${formatDate(dateRange.from)}&endDate=${formatDate(dateRange.to)}&custom=true`;
      } else {
        url += `&timeRange=${timeRange}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch historical data");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  const formatChartData = () => {
    if (!data?.data || data.data.length === 0) return [];
    
    return data.data
      .slice()
      .reverse() // Show oldest to newest
      .map(point => ({
        time: new Date(point.timestamp).toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: timeRange === "24hrs" ? '2-digit' : undefined,
          minute: timeRange === "24hrs" ? '2-digit' : undefined,
        }),
        aqi: point.aqi,
        fullTime: new Date(point.timestamp).toLocaleString(),
      }));
  };

  const getStats = () => {
    if (!data?.data || data.data.length === 0) {
      return { avg: 0, max: 0, min: 0, trend: "neutral" as const };
    }

    const aqiValues = data.data.map(d => d.aqi);
    const avg = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    const max = Math.max(...aqiValues);
    const min = Math.min(...aqiValues);

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(aqiValues.length / 2);
    const firstHalfAvg = aqiValues.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const secondHalfAvg = aqiValues.slice(midpoint).reduce((a, b) => a + b, 0) / (aqiValues.length - midpoint);
    
    const trend = secondHalfAvg > firstHalfAvg + 5 ? "up" : secondHalfAvg < firstHalfAvg - 5 ? "down" : "neutral";

    return { avg, max, min, trend };
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const aqi = payload[0].value;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-semibold mb-1">{payload[0].payload.fullTime}</p>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getAQIColor(aqi) }}
            />
            <p className="text-lg font-bold">AQI: {aqi}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{getAQICategory(aqi)}</p>
        </div>
      );
    }
    return null;
  };

  const stats = getStats();
  const chartData = formatChartData();

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-slate-200/50 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Historical AQI Data
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track air quality trends over time
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(val) => {
            setTimeRange(val as TimeRange);
            setUseCustomRange(false);
          }}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[9999] bg-white shadow-xl" align="end" sideOffset={10} avoidCollisions={true} collisionPadding={20}>
              <SelectItem value="24hrs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last 24 Hours
                </div>
              </SelectItem>
              <SelectItem value="7days">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last 7 Days
                </div>
              </SelectItem>
              <SelectItem value="30days">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last 30 Days
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-amber-50 text-amber-800 p-6 rounded-xl text-center">
          <p className="font-medium mb-2">Unable to Load Historical Data</p>
          <p className="text-sm">
            Historical data is being collected. Save this location and check back later for accumulated data.
          </p>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50"
            >
              <div className="text-sm text-muted-foreground mb-1">Average AQI</div>
              <div className="text-2xl font-bold" style={{ color: getAQIColor(stats.avg) }}>
                {stats.avg}
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                {getAQICategory(stats.avg)}
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50"
            >
              <div className="text-sm text-muted-foreground mb-1">Peak AQI</div>
              <div className="text-2xl font-bold" style={{ color: getAQIColor(stats.max) }}>
                {stats.max}
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                {getAQICategory(stats.max)}
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50"
            >
              <div className="text-sm text-muted-foreground mb-1">Best AQI</div>
              <div className="text-2xl font-bold" style={{ color: getAQIColor(stats.min) }}>
                {stats.min}
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                {getAQICategory(stats.min)}
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50"
            >
              <div className="text-sm text-muted-foreground mb-1">Trend</div>
              <div className="flex items-center gap-2 mt-2">
                {stats.trend === "up" && (
                  <>
                    <TrendingUp className="w-6 h-6 text-red-500" />
                    <span className="text-lg font-bold text-red-500">Worsening</span>
                  </>
                )}
                {stats.trend === "down" && (
                  <>
                    <TrendingDown className="w-6 h-6 text-green-500" />
                    <span className="text-lg font-bold text-green-500">Improving</span>
                  </>
                )}
                {stats.trend === "neutral" && (
                  <>
                    <Activity className="w-6 h-6 text-blue-500" />
                    <span className="text-lg font-bold text-blue-500">Stable</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50"
            >
              <div className="w-full overflow-x-auto pb-4">
                <div style={{ minWidth: '600px', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9488" stopOpacity={0.7} />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                        label={{ value: 'AQI', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                        domain={[0, 'auto']}
                        allowDataOverflow={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="aqi"
                        stroke="#0d9488"
                        strokeWidth={2}
                        fill="url(#aqiGradient)"
                        dot={{ fill: "#0d9488", r: 3 }}
                        activeDot={{ fill: "#0d9488", r: 5, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-xs text-muted-foreground">
                  {data.count} data points over {timeRange === "24hrs" ? "24 hours" : timeRange === "7days" ? "7 days" : "30 days"}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-blue-50 text-blue-800 p-6 rounded-xl text-center">
              <p className="font-medium">No data available for this time range</p>
              <p className="text-sm mt-1">
                Data is being collected. Check back after saving and monitoring this location.
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
