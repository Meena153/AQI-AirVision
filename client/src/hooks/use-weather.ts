import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useState, useEffect } from "react";

// Types derived from schema
// In a real app we'd import these from schema, but using 'any' in api definition 
// meant we need to rely on the shared types defined in schema.ts
import type { CombinedAirData, TripPlanResponse } from "@shared/schema";

export function useWeather(params?: { lat?: number; lon?: number; city?: string }) {
  // Construct a key that includes all params to ensure uniqueness
  const queryKey = [api.weather.get.path, params];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Filter out undefined params
      const validParams: Record<string, string | number> = {};
      if (params?.lat) validParams.lat = params.lat;
      if (params?.lon) validParams.lon = params.lon;
      if (params?.city) validParams.city = params.city;

      const queryString = new URLSearchParams(validParams as Record<string, string>).toString();
      const url = `${api.weather.get.path}?${queryString}`;
      
      console.log(`🌍 Fetching weather data from: ${url}`);
      
      const res = await fetch(url);
      
      console.log(`📡 Response status: ${res.status}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          console.error(`❌ Location not found (404)`);
          return null; // Handle city not found gracefully
        }
        const errorText = await res.text();
        console.error(`❌ API Error (${res.status}):`, errorText);
        throw new Error("Failed to fetch weather data");
      }
      // In a real scenario we'd use the Zod schema from api.weather.get.responses[200]
      // simplified here since we used z.custom<any> in the manifest
      const data = (await res.json()) as CombinedAirData;
      console.log(`✅ Successfully fetched data for: ${data.location}`);
      return data;
    },
    enabled: !!(params?.lat && params?.lon) || !!params?.city,
    staleTime: 1000 * 60 * 5, // 5 minutes - cache for faster loads
    refetchOnMount: false, // Use cached data
    refetchOnWindowFocus: false,
  });
}

// Hook to get user's current geolocation
export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message || "Failed to get your location");
        setLoading(false);
      }
    );
  };

  return { location, error, loading, requestLocation };
}

export function useTripPlan() {
  return useMutation({
    mutationFn: async (data: { start: string; end: string }) => {
      const res = await fetch(api.trip.plan.path, {
        method: api.trip.plan.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error("Failed to calculate trip plan");
      return (await res.json()) as TripPlanResponse;
    },
  });
}
