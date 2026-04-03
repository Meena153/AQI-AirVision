import { useAuth } from "@/hooks/use-auth";
import { useLocations, useDeleteLocation, useDeleteAllLocations } from "@/hooks/use-locations";
import { useQuery } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { AQIGauge } from "@/components/AQIGauge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, ArrowRight, ArrowLeft } from "lucide-react";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { BarChart3 } from "lucide-react";
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
import { useState } from "react";

// Individual Location Card Component to fetch its own data
function LocationCard({ location, onDelete }: { location: any, onDelete: (id: number) => void }) {
  // Fetch specific weather/air data for this location
  // Include city name in query to get consistent worst-case AQI
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: [api.weather.get.path, { lat: location.lat, lon: location.lon, city: location.name, locationId: location.id }],
    queryFn: async () => {
      const res = await fetch(`${api.weather.get.path}?lat=${location.lat}&lon=${location.lon}&city=${encodeURIComponent(location.name)}&locationId=${location.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on every focus
    refetchOnMount: false, // Use cached data on mount
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-2xl" />;

  return (
    <div className="relative group bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 shadow-lg border border-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-display font-bold text-base text-slate-800 mb-1">{location.name}</h3>
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  📍 {location.lat.toFixed(6)}°N, {location.lon.toFixed(6)}°E
                </p>
                {location.createdAt && (
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Saved: {new Date(location.createdAt).toLocaleString('en-IN', { 
                      year: 'numeric',
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric', 
                      minute: '2-digit', 
                      hour12: true, 
                      timeZone: 'Asia/Kolkata' 
                    })}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Last updated: {new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full h-7 w-7 relative z-10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(location.id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <AQIGauge value={data.airQuality.aqi} size="sm" />
              <div className="text-right">
                <div className="text-xl font-bold font-display">{Math.round(data.weather.temp)}°C</div>
                <div className="text-xs text-muted-foreground capitalize">{data.weather.condition}</div>
              </div>
            </div>
            
            <Link href={`/air-quality?lat=${location.lat}&lon=${location.lon}&city=${encodeURIComponent(location.name)}`}>
              <div className="absolute inset-0 z-0 cursor-pointer"></div>
            </Link>
            
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Details <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <Link href={`/report?lat=${location.lat}&lon=${location.lon}&city=${encodeURIComponent(location.name)}`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1 h-7 text-xs">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Report
                </Button>
              </Link>
            </div>
          </div>
  );
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  // Only fetch locations after auth is confirmed
  const { data: locations, isLoading: locationsLoading } = useLocations(!!user && !authLoading);
  const { toast } = useToast();
  const { mutate: deleteLocation } = useDeleteLocation();
  const { mutate: deleteAllLocations, isPending: isDeletingAll } = useDeleteAllLocations();
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const handleDelete = (id: number) => {
    deleteLocation(id, {
      onSuccess: () => {
        toast({
          title: "Location deleted",
          description: "The location has been removed from your dashboard.",
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to delete location",
          description: error.message || "An error occurred while deleting the location.",
          variant: "destructive",
        });
      },
    });
  };

  const handleClearAll = () => {
    deleteAllLocations(undefined, {
      onSuccess: () => {
        toast({
          title: "All locations cleared",
          description: "All locations have been removed from your dashboard.",
        });
        setShowClearAllDialog(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to clear locations",
          description: error.message || "An error occurred while clearing all locations.",
          variant: "destructive",
        });
      },
    });
  };

  // Always show loading while checking auth - never render content prematurely
  if (authLoading || user === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect after confirming user is null (not logged in)
  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
      <div className="relative container mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4 hover:bg-slate-100"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">My Dashboard</h1>
            <p className="text-muted-foreground">Monitor your favorite places at a glance.</p>
          </div>
          <div className="flex gap-2">
            {locations && locations.length > 0 && (
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowClearAllDialog(true)}
                disabled={isDeletingAll}
              >
                <Trash2 className="w-4 h-4" /> Clear All
              </Button>
            )}
            <Link href="/">
              <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add New Location
              </Button>
            </Link>
          </div>
        </div>

        {locationsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : locations && locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <LocationCard key={loc.id} location={loc} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-dashed border-slate-300 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">No locations saved yet</h3>
            <p className="text-muted-foreground mb-6">Start by searching for a city on the home page.</p>
            <Link href="/">
              <Button variant="outline">Search Cities</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all locations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {locations?.length || 0} saved location{locations?.length !== 1 ? 's' : ''} from your dashboard. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingAll ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
