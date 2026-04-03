import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";

interface ForecastChartProps {
  data: { value: number; time: string }[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  const chartData = data.map(item => ({
    time: format(parseISO(item.time), "HH:mm"),
    fullTime: format(parseISO(item.time), "MMM d, HH:mm"),
    aqi: item.value,
  }));

  const getAQIColor = (value: number) => {
    if (value <= 50) return "#10b981"; // emerald-500
    if (value <= 100) return "#eab308"; // yellow-500
    if (value <= 150) return "#f97316"; // orange-500
    if (value <= 250) return "#a855f7"; // purple-500
    if (value <= 350) return "#ef4444"; // red-500
    return "#4c0519"; // rose-900
  };

  return (
    <div className="mt-6 w-full overflow-x-auto pb-4">
      <div className="h-[300px] min-w-[600px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }} 
              interval={11} // Show every 12 hours (approx)
              stroke="#94a3b8"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              stroke="#94a3b8"
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
              }}
              labelStyle={{ fontWeight: 'bold' }}
              formatter={(value: number) => [`${value} AQI`, "Air Quality"]}
              labelFormatter={(label, payload) => payload[0]?.payload?.fullTime || label}
            />
            <Area 
              type="monotone" 
              dataKey="aqi" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAqi)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
