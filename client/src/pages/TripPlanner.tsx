import { useState, useEffect, useRef } from "react";
import { useTripPlan } from "@/hooks/use-weather";
import { AQIGauge } from "@/components/AQIGauge";
import { WeatherCard } from "@/components/WeatherCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Loader2, Plane, Calendar as CalendarIcon, Activity, ArrowLeft, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export default function TripPlanner() {
  const [location, setLocation] = useLocation();
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Initialize state from URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const [startCity, setStartCity] = useState(searchParams.get("start") || "");
  const [endCity, setEndCity] = useState(searchParams.get("end") || "");
  const [date, setDate] = useState<Date | undefined>(() => {
    const dateParam = searchParams.get("date");
    return dateParam ? new Date(dateParam) : undefined;
  });
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { mutate: planTrip, data: plan, isPending, error, reset: resetMutation } = useTripPlan();

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Show recommendation dialog when plan data is received
  useEffect(() => {
    if (plan) {
      setShowRecommendation(true);
      // Scroll to results section
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [plan]);

  // Restore search on mount if URL has parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get("start");
    const end = params.get("end");
    const dateParam = params.get("date");
    
    if (start && end) {
      planTrip({ 
        start, 
        end,
        // @ts-ignore - handled by server
        date: dateParam || undefined
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startCity && endCity) {
      // Update URL with search parameters
      const params = new URLSearchParams();
      params.set("start", startCity);
      params.set("end", endCity);
      if (date) {
        params.set("date", date.toISOString());
      }
      window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
      
      planTrip({ 
        start: startCity, 
        end: endCity,
        // @ts-ignore - handled by server
        date: date ? date.toISOString() : undefined
      });
    }
  };

  const handleClear = () => {
    setStartCity("");
    setEndCity("");
    setDate(undefined);
    setShowRecommendation(false);
    resetMutation(); // Clear the mutation data
    // Clear URL parameters
    window.history.pushState({}, "", window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-slate-100"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Trip Air Quality Planner</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compare air quality conditions between your departure and arrival cities to plan a safe and healthy journey.
          </p>
        </div>

        <Card className="p-8 rounded-3xl shadow-xl bg-white border-none mb-12">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Departure City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  value={startCity}
                  onChange={(e) => setStartCity(e.target.value)}
                  placeholder="e.g. New York" 
                  className="pl-10 h-12 rounded-xl text-lg"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-center pb-3 text-muted-foreground">
              <ArrowRight className="hidden md:block w-6 h-6" />
              <div className="md:hidden rotate-90 w-6 h-6">➜</div>
            </div>

            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Destination City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  value={endCity}
                  onChange={(e) => setEndCity(e.target.value)}
                  placeholder="e.g. London" 
                  className="pl-10 h-12 rounded-xl text-lg"
                />
              </div>
            </div>

            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Trip Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-12 pl-3 text-left font-normal rounded-xl border-input",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-slate-200 shadow-2xl relative z-[99999]" align="start" side="bottom" sideOffset={4} style={{ zIndex: 99999 }}>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                    className="bg-white rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold min-w-[140px]"
              disabled={isPending || !startCity || !endCity}
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Compare"}
            </Button>
            
            {(startCity || endCity || date || plan) && (
              <Button 
                type="button"
                size="sm" 
                variant="outline"
                className="h-10 px-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium text-sm"
                onClick={handleClear}
                disabled={isPending}
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Clear
              </Button>
            )}
          </form>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center mb-8">
            Failed to plan trip. Please check city names and try again.
          </div>
        )}

        {plan && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Floating Recommendation Popup - Upper Right (Inline on mobile) */}
            {showRecommendation && (
              <motion.div
                initial={{ opacity: 0, lg: { x: 100 }, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, lg: { x: 100 }, scale: 0.9 }}
                drag={isDesktop}
                dragMomentum={false}
                className={`static lg:fixed lg:top-32 lg:right-8 z-40 w-full lg:w-80 bg-white rounded-xl shadow-xl lg:shadow-2xl border border-slate-200 overflow-hidden ${isDesktop ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <h3 className="font-bold text-base">Travel Recommendation</h3>
                    </div>
                    <button
                      onClick={() => setShowRecommendation(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  {date && (
                    <p className="text-xs text-blue-100 mt-1">
                      {format(date, "PPP")}
                    </p>
                  )}
                </div>
                
                <div className="p-3 space-y-3">
                  {/* AQI Comparison */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-[10px] text-muted-foreground mb-1 uppercase font-semibold">Departure</div>
                      <div className="font-bold text-xs mb-1 truncate">{plan.start.location}</div>
                      <div className="flex items-center gap-1">
                        <div className="text-xl font-bold text-red-600">{plan.start.airQuality.aqi}</div>
                        <div className="text-[10px] text-muted-foreground">AQI</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-[10px] text-muted-foreground mb-1 uppercase font-semibold">Destination</div>
                      <div className="font-bold text-xs mb-1 truncate">{plan.end.location}</div>
                      <div className="flex items-center gap-1">
                        <div className="text-xl font-bold text-red-600">{plan.end.airQuality.aqi}</div>
                        <div className="text-[10px] text-muted-foreground">AQI</div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Message */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-start gap-2">
                      {plan.start.airQuality.aqi <= 100 && plan.end.airQuality.aqi <= 100 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : plan.start.airQuality.aqi > 150 || plan.end.airQuality.aqi > 150 ? (
                        <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-xs mb-1 text-slate-900">Advice</h4>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {plan.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href="/health" className="block">
                    <Button variant="outline" className="w-full" size="sm">
                      <Activity className="w-4 h-4 mr-2" />
                      View Health Guide
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Departure Card */}
              <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600 mb-4 uppercase tracking-wide">Departure</div>
                <h2 className="text-2xl font-display font-bold mb-6">{plan.start.location}</h2>
                <div className="flex justify-center mb-6">
                  <AQIGauge value={plan.start.airQuality.aqi} />
                </div>
                <WeatherCard data={plan.start.weather} />
              </div>

              {/* Destination Card */}
              <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 uppercase tracking-wide">Destination</div>
                <h2 className="text-2xl font-display font-bold mb-6">{plan.end.location}</h2>
                <div className="flex justify-center mb-6">
                  <AQIGauge value={plan.end.airQuality.aqi} />
                </div>
                <WeatherCard data={plan.end.weather} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
