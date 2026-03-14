import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertSavedLocation, SavedLocation } from "@shared/schema";

export function useLocations(enabled: boolean = true) {
  return useQuery({
    queryKey: [api.locations.list.path],
    queryFn: async () => {
      const res = await fetch(api.locations.list.path, { credentials: "include" });
      if (res.status === 401) return null; // Handle unauthorized gracefully
      if (!res.ok) throw new Error("Failed to fetch saved locations");
      return api.locations.list.responses[200].parse(await res.json());
    },
    enabled, // Allow caller to control when this query runs
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data
    retry: false, // Don't retry on auth failures
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSavedLocation) => {
      const res = await fetch(api.locations.create.path, {
        method: api.locations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to save location");
      return api.locations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.locations.delete.path, { id });
      const res = await fetch(url, {
        method: api.locations.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete location");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
    },
  });
}

export function useDeleteAllLocations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.locations.deleteAll.path, {
        method: api.locations.deleteAll.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete all locations");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
    },
  });
}
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { api, buildUrl } from "@shared/routes";
// import type { InsertSavedLocation } from "@shared/schema";

// export function useLocations() {
//   return useQuery({
//     queryKey: [api.locations.list.path],
//     queryFn: async () => {
//       const res = await fetch(api.locations.list.path, {
//         credentials: "include",
//       });

//       // ✅ return empty list if not logged in
//       if (res.status === 401) return [];

//       if (!res.ok) {
//         const txt = await res.text();
//         throw new Error(txt || "Failed to fetch saved locations");
//       }

//       // ✅ don't parse with zod now (to avoid mismatch errors)
//       return (await res.json()) as any[];
//     },
//     initialData: [], // ✅ important
//   });
// }

// export function useCreateLocation() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (data: InsertSavedLocation) => {
//       // ✅ force correct payload keys
//       const payload = {
//         name: data.name,
//         lat: Number(data.lat),
//         lon: Number(data.lon),
//       };

//       const res = await fetch(api.locations.create.path, {
//         method: api.locations.create.method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//         credentials: "include",
//       });

//       if (!res.ok) {
//         const txt = await res.text();
//         throw new Error(txt || "Failed to save location");
//       }

//       return await res.json();
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
//     },
//   });
// }

// export function useDeleteLocation() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (id: number) => {
//       const url = buildUrl(api.locations.delete.path, { id });

//       const res = await fetch(url, {
//         method: api.locations.delete.method,
//         credentials: "include",
//       });

//       if (!res.ok) {
//         const txt = await res.text();
//         throw new Error(txt || "Failed to delete location");
//       }
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
//     },
//   });
// }

