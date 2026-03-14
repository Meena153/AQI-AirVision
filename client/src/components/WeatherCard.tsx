import { Wind, Droplets, ThermometerSun } from "lucide-react";
import type { WeatherData } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface WeatherCardProps {
  data: WeatherData;
  className?: string;
}

export function WeatherCard({ data, className }: WeatherCardProps) {
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      <Card className="p-4 flex flex-col items-center justify-center border-none shadow-sm bg-blue-50/50 hover:bg-blue-50 transition-colors">
        <div className="bg-white p-2 rounded-full shadow-sm mb-2">
          <ThermometerSun className="h-5 w-5 text-orange-500" />
        </div>
        <span className="text-2xl font-bold font-display text-foreground">{Math.round(data.temp)}°C</span>
        <span className="text-xs text-muted-foreground font-medium">Temperature</span>
      </Card>

      <Card className="p-4 flex flex-col items-center justify-center border-none shadow-sm bg-blue-50/50 hover:bg-blue-50 transition-colors">
        <div className="bg-white p-2 rounded-full shadow-sm mb-2">
          <Droplets className="h-5 w-5 text-blue-500" />
        </div>
        <span className="text-2xl font-bold font-display text-foreground">{data.humidity}%</span>
        <span className="text-xs text-muted-foreground font-medium">Humidity</span>
      </Card>

      <Card className="p-4 flex flex-col items-center justify-center border-none shadow-sm bg-blue-50/50 hover:bg-blue-50 transition-colors">
        <div className="bg-white p-2 rounded-full shadow-sm mb-2">
          <Wind className="h-5 w-5 text-teal-500" />
        </div>
        <span className="text-2xl font-bold font-display text-foreground">{data.windSpeed}</span>
        <span className="text-xs text-muted-foreground font-medium">m/s Wind</span>
      </Card>
    </div>
  );
}
