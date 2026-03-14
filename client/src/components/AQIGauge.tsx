import { motion } from "framer-motion";

interface AQIGaugeProps {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  standard?: "US" | "Indian";
  category?: { label: string; color: string };
}

export function AQIGauge({ value, size = "md", className = "", standard = "US", category }: AQIGaugeProps) {
  // Determine color and label based on AQI value and standard
  let color = "#10B981"; // Green color for Good (default)
  let bgColor = "bg-emerald-500";
  let label = "Good";
  let description = "Air quality is satisfactory.";

  if (category) {
    // Use provided category
    label = category.label;
    // Convert hex color to Tailwind classes or use inline styles
    const hexColor = category.color;
    color = hexColor;
  } else if (standard === "Indian") {
    // Indian AQI thresholds
    if (value <= 50) { color = "#10B981"; label = "Good"; }
    else if (value <= 100) { color = "#84CC16"; label = "Satisfactory"; }
    else if (value <= 200) { color = "#EAB308"; label = "Moderate"; }
    else if (value <= 300) { color = "#F97316"; label = "Poor"; }
    else if (value <= 400) { color = "#EF4444"; label = "Very Poor"; }
    else { color = "#7F1D1D"; label = "Severe"; }
  } else {
    // US EPA AQI thresholds
    if (value <= 50) { color = "#10B981"; label = "Good"; }
    else if (value <= 100) { color = "#EAB308"; label = "Moderate"; }
    else if (value <= 150) { color = "#F97316"; label = "Unhealthy (Sensitive)"; }
    else if (value <= 200) { color = "#EF4444"; label = "Unhealthy"; }
    else if (value <= 300) { color = "#A855F7"; label = "Severe"; }
    else { color = "#7F1D1D"; label = "Hazardous"; }
  }

  // Size configurations
  const sizes = {
    sm: { width: 100, stroke: 8, fontSize: "text-2xl", labelSize: "text-xs" },
    md: { width: 180, stroke: 12, fontSize: "text-5xl", labelSize: "text-sm" },
    lg: { width: 260, stroke: 16, fontSize: "text-7xl", labelSize: "text-lg" },
  };
  
  const { width, stroke, fontSize, labelSize } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 500) / 500) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* SVG Gauge */}
        <svg width={width} height={width} className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-muted/30"
          />
          {/* Progress Circle */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx={width / 2}
            cy={width / 2}
            r={radius}
            stroke={category?.color || color}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Value in Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold ${fontSize}`} style={{ color: category?.color || color }}>
            {value}
          </span>
          <span className={`font-medium text-muted-foreground ${labelSize}`}>AQI</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h3 className={`font-display font-bold text-xl`} style={{ color: category?.color || color }}>{label}</h3>
      </div>
    </div>
  );
}
