import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useUser() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (!res.ok) return null; // Return null if not authenticated
      const data = await res.json();
      return data ? api.auth.me.responses[200].parse(data) : null;
    },
    retry: false,
    staleTime: 0, // Always verify auth state - don't use stale data for protected routes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Check auth status when window regains focus
    refetchOnMount: true, // Always verify auth status on protected routes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid email or password");
        throw new Error("Login failed");
      }
      
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      toast({ title: "Welcome back!", description: `Logged in as ${user.name}` });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({ 
        title: "Login Failed", 
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, { 
        method: api.auth.logout.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      toast({ title: "Logged out", description: "See you next time!" });
      setLocation("/");
    },
  });
}

export function useAuth() {
  const { data: user, isLoading, isFetching, isPending, fetchStatus, refetch } = useUser();
  const logout = useLogout();

  // Block rendering until we have a definitive auth state
  // This prevents showing cached content before auth verification
  const isCheckingAuth = isPending || (fetchStatus === 'fetching') || (isLoading && user === undefined);

  return {
    user,
    isLoading: isCheckingAuth,
    isAuthenticated: !!user,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
    refetchUser: refetch,
  };
}
