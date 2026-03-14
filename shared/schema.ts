import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";

// === TABLE DEFINITIONS ===
export const saved_locations = pgTable("saved_locations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Links to auth user
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const search_history = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Optional, for logged in users
  query: text("query").notNull(),
  searchedAt: timestamp("searched_at").defaultNow(),
});

// === SCHEMAS ===
// export const insertLocationSchema = createInsertSchema(saved_locations).omit({ id: true, createdAt: true });
// export const insertHistorySchema = createInsertSchema(search_history).omit({ id: true, searchedAt: true });

// === TYPES ===
// export type SavedLocation = typeof saved_locations.$inferSelect;
// export type InsertSavedLocation = z.infer<typeof insertLocationSchema>;
// export type SearchHistory = typeof search_history.$inferSelect;
// export type InsertSearchHistory = z.infer<typeof insertHistorySchema>;

// === API TYPES ===
export type AirQualityData = {
  aqi: number;
  city: string;
  dominentpol: string;
  dataSource?: string; // "WAQI/aqicn.org (Government Station)" | "OpenWeatherMap Air Pollution API" | "Open-Meteo (Modeled Data)"
  stationName?: string; // Only for WAQI
  stationUrl?: string;  // Only for WAQI - Direct link to aqicn.org station page
  iaqi: {
    pm25?: { v: number };
    pm10?: { v: number };
    o3?: { v: number };
    no2?: { v: number };
    so2?: { v: number };
    co?: { v: number };
    t?: { v: number }; // Temperature
    h?: { v: number }; // Humidity
    w?: { v: number }; // Wind
  };
  forecast: {
    daily: {
      aqi?: { value: number; time: string }[];
      o3?: { avg: number; day: string; max: number; min: number }[];
      pm10?: { avg: number; day: string; max: number; min: number }[];
      pm25?: { avg: number; day: string; max: number; min: number }[];
    };
  };
};

export type WeatherData = {
  temp: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  icon: string;
};

export type CombinedAirData = {
  location: string;
  fullAddress?: string;
  neighborhood?: string;
  district?: string;
  lat: number;
  lon: number;
  airQuality: AirQualityData;
  weather: WeatherData;
};

export type TripPlanRequest = {
  start: string; // City name
  end: string;   // City name
  date?: string; // Trip date
};

export type TripPlanResponse = {
  start: CombinedAirData;
  end: CombinedAirData;
  recommendation: string;
};

export type HistoricalDataPoint = {
  timestamp: string;
  aqi: number;
  locationName: string;
};

export type HistoricalAQIResponse = {
  lat: number;
  lon: number;
  timeRange: "24hrs" | "7days" | "30days" | "6months" | "1year" | "2years";
  hours: number;
  data: HistoricalDataPoint[];
  count: number;
};
// import {
//   pgTable,
//   text,
//   serial,
//   timestamp,
//   jsonb,
//   doublePrecision,
// } from "drizzle-orm/pg-core";
// import { createInsertSchema } from "drizzle-zod";
// import { z } from "zod";
import { sql } from "drizzle-orm";

// =======================
// USERS TABLE (NEW)
// =======================
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(), // crypto.randomUUID()
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// =======================
// EXISTING TABLES
// =======================
// export const saved_locations = pgTable("saved_locations", {
//   id: serial("id").primaryKey(),
//   userId: text("user_id").notNull(), // links to users.id
//   name: text("name").notNull(),
//   lat: doublePrecision("lat").notNull(),
//   lon: doublePrecision("lon").notNull(),
//   createdAt: timestamp("created_at").defaultNow(),
// });

// export const search_history = pgTable("search_history", {
//   id: serial("id").primaryKey(),
//   userId: text("user_id").notNull(), // ✅ now required (only logged in users can access)
//   query: text("query").notNull(),
//   searchedAt: timestamp("searched_at").defaultNow(),
// });

// // =======================
// // INSERT SCHEMAS
// // =======================
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(saved_locations).omit({
  id: true,
  createdAt: true,
});

export const insertHistorySchema = createInsertSchema(search_history).omit({
  id: true,
  searchedAt: true,
});

// // =======================
// // AUTH INPUT VALIDATION
// // =======================
// export const registerSchema = z.object({
//   name: z.string().min(2, "Name is too short"),
//   email: z.string().email("Invalid email"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
// });

// export const loginSchema = z.object({
//   email: z.string().email("Invalid email"),
//   password: z.string().min(1, "Password required"),
// });

// // =======================
// // TYPES
// // =======================
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SavedLocation = typeof saved_locations.$inferSelect;
export type InsertSavedLocation = z.infer<typeof insertLocationSchema>;

export type SearchHistory = typeof search_history.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertHistorySchema>;

// // =======================
// // API TYPES (UNCHANGED)
// // =======================
// export type AirQualityData = {
//   aqi: number;
//   city: string;
//   dominentpol: string;
//   iaqi: {
//     pm25?: { v: number };
//     pm10?: { v: number };
//     o3?: { v: number };
//     no2?: { v: number };
//     so2?: { v: number };
//     co?: { v: number };
//     t?: { v: number }; // Temperature
//     h?: { v: number }; // Humidity
//     w?: { v: number }; // Wind
//   };
//   forecast: {
//     daily: {
//       o3?: { avg: number; day: string; max: number; min: number }[];
//       pm10?: { avg: number; day: string; max: number; min: number }[];
//       pm25?: { avg: number; day: string; max: number; min: number }[];
//     };
//   };
// };

// export type WeatherData = {
//   temp: number;
//   humidity: number;
//   condition: string;
//   windSpeed: number;
//   icon: string;
// };

// export type CombinedAirData = {
//   location: string;
//   lat: number;
//   lon: number;
//   airQuality: AirQualityData;
//   weather: WeatherData;
// };

// export type TripPlanRequest = {
//   start: string;
//   end: string;
//   date?: string;
// };

// export type TripPlanResponse = {
//   start: CombinedAirData;
//   end: CombinedAirData;
//   recommendation: string;
// };
// 
// ✅ AQI History Table (Time-Series)
export const aqiHistory = pgTable("aqi_history", {
  id: serial("id").primaryKey(),

  // If you already have locations table, reference it
  locationId: integer("location_id").notNull(),

  // Time when AQI data recorded
  recordedAt: timestamp("recorded_at").notNull(),

  // Pollutants
  pm2_5: doublePrecision("pm2_5").default(0),
  pm10: doublePrecision("pm10").default(0),
  co: doublePrecision("co").default(0),
  no2: doublePrecision("no2").default(0),
  so2: doublePrecision("so2").default(0),
  o3: doublePrecision("o3").default(0),

  // AQI value
  aqi: doublePrecision("aqi").default(0),
});