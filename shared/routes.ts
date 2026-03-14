import { z } from "zod";
import { insertUserSchema, insertHistorySchema, SearchHistory, search_history } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  // ======================
  // AUTH ROUTES
  // ======================
  auth: {
    register: {
      method: "POST" as const,
      path: "/api/register",
      input: z.object({
        name: z.string().min(2, "Name is too short"),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
      responses: {
        201: z.object({ id: z.string(), name: z.string() }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: "POST" as const,
      path: "/api/login",
      input: z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(1, "Password required"),
      }),
      responses: {
        200: z.object({ id: z.string(), name: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.object({ id: z.string(), name: z.string(), email: z.string(), locationApiProvider: z.string().optional() }).nullable(),
      },
    },
    updateSettings: {
      method: "PATCH" as const,
      path: "/api/user/settings",
      input: z.object({
        locationApiProvider: z.enum(['nominatim', 'openweather', 'google', 'mapbox']).optional(),
      }),
      responses: {
        200: z.object({ message: z.string(), user: z.object({ id: z.string(), name: z.string(), email: z.string(), locationApiProvider: z.string().optional() }) }),
        401: errorSchemas.unauthorized,
        400: errorSchemas.validation,
      },
    },
    availableProviders: {
      method: "GET" as const,
      path: "/api/user/location-providers",
      responses: {
        200: z.array(z.object({
          provider: z.string(),
          name: z.string(),
          available: z.boolean(),
        })),
      },
    },
  },

  // ======================
  // WEATHER ROUTES
  // ======================
  weather: {
    get: {
      method: "GET" as const,
      path: "/api/weather",
      input: z.object({
        lat: z.coerce.number().optional(),
        lon: z.coerce.number().optional(),
        city: z.string().optional(),
      }),
      responses: {
        200: z.custom<any>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },

  // ======================
  // LOCATION SEARCH ROUTE
  // (search by query string)
  // ======================
  location: {
    search: {
      method: "GET" as const,
      path: "/api/location/search",
      input: z.object({ q: z.string() }),
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            country: z.string().optional(),
            admin1: z.string().optional(),
          })
        ),
      },
    },
  },

  // ======================
  // ✅ SAVED LOCATIONS ROUTES (FIXED)
  // Used in: use-locations.ts
  // ======================
  locations: {
    list: {
      method: "GET" as const,
      path: "/api/locations",
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            userId: z.string(),
            name: z.string(),
            lat: z.number(),
            lon: z.number(),
            createdAt: z.any().optional(), // date/string
          })
        ),
        401: errorSchemas.unauthorized,
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/locations",
      input: z.object({
        name: z.string().min(1),
        lat: z.number(),
        lon: z.number(),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          userId: z.string(),
          name: z.string(),
          lat: z.number(),
          lon: z.number(),
          createdAt: z.any().optional(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },

    delete: {
      method: "DELETE" as const,
      path: "/api/locations/:id",
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },

    deleteAll: {
      method: "DELETE" as const,
      path: "/api/locations",
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  // ======================
  // TRIP ROUTES
  // ======================
  trip: {
    plan: {
      method: "POST" as const,
      path: "/api/trip/plan",
      input: z.object({
        start: z.string(),
        end: z.string(),
        date: z.string().optional(),
      }),
      responses: {
        200: z.custom<any>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },

  // ======================
  // AQI ROUTES
  // ======================
  aqi: {
    get: {
      method: "GET" as const,
      path: "/api/aqi",
      input: z.object({
        lat: z.string(),
        lon: z.string(),
      }),
      responses: {
        200: z.object({
          aqi: z.number(),
          pollutants: z.object({
            pm2_5: z.number(),
            pm10: z.number(),
            co: z.number(),
            no2: z.number(),
            so2: z.number(),
            o3: z.number(),
          }),
          weather: z.object({
            temperature: z.number(),
            humidity: z.number(),
            wind_speed: z.number(),
          }),
          forecast: z.array(
            z.object({
              time: z.string(),
              aqi: z.number(),
            })
          ),
        }),
      },
    },
  },

  // ======================
  // HISTORY ROUTES
  // ======================
  history: {
    list: {
      method: "GET" as const,
      path: "/api/history",
      responses: {
        200: z.array(z.custom<typeof search_history.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/history",
      input: insertHistorySchema,
      responses: {
        201: z.custom<typeof search_history.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
