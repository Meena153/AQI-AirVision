import { db } from "./db";
import {
  users,
  saved_locations,
  search_history,
  type User,
  type InsertUser,
  type InsertSavedLocation,
  type SavedLocation,
  type InsertSearchHistory,
  type SearchHistory,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { aqiHistory } from "@shared/schema";
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSettings(id: string, settings: { locationApiProvider?: string }): Promise<void>;

  // Locations
  getSavedLocations(userId: string): Promise<SavedLocation[]>;
  createSavedLocation(location: InsertSavedLocation): Promise<SavedLocation>;
  deleteSavedLocation(id: number, userId: string): Promise<void>;
  deleteAllSavedLocations(userId: string): Promise<void>;

  // History
  createSearchHistory(history: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistory(userId: string): Promise<SearchHistory[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserSettings(id: string, settings: { locationApiProvider?: string }): Promise<void> {
    await db.update(users).set(settings).where(eq(users.id, id));
  }

  async getSavedLocations(userId: string): Promise<SavedLocation[]> {
    return await db
      .select()
      .from(saved_locations)
      .where(eq(saved_locations.userId, userId))
      .orderBy(desc(saved_locations.createdAt));
  }

  async createSavedLocation(location: InsertSavedLocation): Promise<SavedLocation> {
    const [saved] = await db.insert(saved_locations).values(location).returning();
    return saved;
  }

  async deleteSavedLocation(id: number, userId: string): Promise<void> {
    await db.delete(saved_locations).where(and(eq(saved_locations.id, id), eq(saved_locations.userId, userId)));
  }

  async deleteAllSavedLocations(userId: string): Promise<void> {
    await db.delete(saved_locations).where(eq(saved_locations.userId, userId));
  }

  async createSearchHistory(history: InsertSearchHistory): Promise<SearchHistory> {
    const [saved] = await db.insert(search_history).values(history).returning();
    return saved;
  }

  async getSearchHistory(userId: string): Promise<SearchHistory[]> {
    return await db
      .select()
      .from(search_history)
      .where(eq(search_history.userId, userId))
      .orderBy(desc(search_history.searchedAt))
      .limit(10);
  }
}
export async function saveAQIHistory(data: {
  locationId: number;
  recordedAt: Date;
  pm2_5?: number;
  pm10?: number;
  co?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  aqi?: number;
}) {
  await db.insert(aqiHistory).values({
    locationId: data.locationId,
    recordedAt: data.recordedAt,
    pm2_5: data.pm2_5 ?? 0,
    pm10: data.pm10 ?? 0,
    co: data.co ?? 0,
    no2: data.no2 ?? 0,
    so2: data.so2 ?? 0,
    o3: data.o3 ?? 0,
    aqi: data.aqi ?? 0,
  });
}

export async function getAQIHistory(locationId: number, limit = 200) {
  return await db
    .select()
    .from(aqiHistory)
    .where(eq(aqiHistory.locationId, locationId))
    .orderBy(desc(aqiHistory.recordedAt))
    .limit(limit);
}


export const storage = new DatabaseStorage();
