import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { searchCities } from "@/data/indian-cities";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LocationSearchProps {
  className?: string;
  variant?: "hero" | "minimal";
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function LocationSearch({ 
  className = "", 
  variant = "hero",
  placeholder = "Enter address, neighborhood, or city (e.g., Times Square, Shibuya, Baker Street)...",
  onSearch 
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle input change and show suggestions
  useEffect(() => {
    if (query.length >= 2) {
      const results = searchCities(query, 8);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent, searchQuery?: string) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);
    
    // Navigate immediately without artificial delay
    setIsLoading(false);
    if (onSearch) {
      onSearch(finalQuery);
    } else {
      setLocation(`/air-quality?city=${encodeURIComponent(finalQuery)}`);
    }
  };

  const handleSuggestionClick = (city: any) => {
    setQuery(city.display);
    setShowSuggestions(false);
    // Navigate immediately without delay
    handleSearch(new Event('submit') as any, city.display);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleCurrentLocation = async () => {
    // Check if user is logged in
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
      return;
    }

    // Check current permission status
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        toast({
          title: "Location Permission Blocked",
          description: "You previously blocked location access. Please click the lock/info icon in your browser's address bar and allow location permission, then try again.",
          variant: "destructive",
          duration: 8000,
        });
        return;
      }
    } catch (err) {
      // Permission API not supported, continue anyway
      console.log('Permission API not supported, proceeding with geolocation request');
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        
        console.log(`✅ Got user location: ${latitude}, ${longitude}`);
        
        toast({
          title: "Location detected",
          description: "If the area name is incorrect, search for your locality manually.",
          duration: 4000,
        });
        
        if (onSearch) {
          onSearch(`${latitude}, ${longitude}`);
        } else {
          const url = `/air-quality?lat=${latitude}&lon=${longitude}`;
          console.log(`Navigating to: ${url}`);
          setLocation(url);
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = "Failed to get your current location.";
        
        // Provide specific error messages
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access was denied. Please click the lock icon in your browser's address bar, allow location access, and try again.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is unavailable. Please check your device settings.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Please try again.";
        }
        
        toast({
          title: "Location Access Needed",
          description: errorMessage,
          variant: "destructive",
          duration: 6000,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex-1">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground z-10" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && setSuggestions(searchCities(query, 8))}
              placeholder={placeholder}
              className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </form>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-64 overflow-y-auto"
            >
              {suggestions.map((city, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(city)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors ${
                    index === selectedIndex ? 'bg-slate-100' : ''
                  } ${index === 0 ? 'rounded-t-xl' : ''} ${index === suggestions.length - 1 ? 'rounded-b-xl' : ''}`}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{city.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{city.state}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full h-10 w-10 shrink-0" 
          onClick={handleCurrentLocation}
          disabled={isLocating}
          title="Use current location"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-4 w-full ${className}`}>
      <div className="relative max-w-lg w-full">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-sky-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl">
              <Search className="ml-6 h-6 w-6 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                placeholder={placeholder}
                className="w-full bg-transparent p-6 text-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <div className="p-2">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isLoading || !query.trim()}
                  className="rounded-xl px-8 font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
        
        {/* Suggestions Dropdown for Hero variant */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto"
          >
            {suggestions.map((city, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(city)}
                className={`w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center gap-4 transition-colors ${
                  index === selectedIndex ? 'bg-slate-100' : ''
                } ${index === 0 ? 'rounded-t-2xl' : ''} ${index === suggestions.length - 1 ? 'rounded-b-2xl' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base truncate">{city.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{city.state}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <Button 
        variant="ghost" 
        className="gap-2 text-muted-foreground hover:text-primary transition-colors"
        onClick={handleCurrentLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        Use my current location
      </Button>

      {/* Authentication Required Dialog */}
      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to check air quality data. Please sign up or log in to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setLocation("/signup")}>
              Sign Up
            </AlertDialogAction>
            <AlertDialogAction onClick={() => setLocation("/login")} className="ml-2">
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
