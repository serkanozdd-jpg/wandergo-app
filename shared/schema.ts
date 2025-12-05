import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarPreset: integer("avatar_preset").default(0),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  favorites: many(favorites),
  visitedPlaces: many(visitedPlaces),
  routes: many(routes),
}));

export const places = pgTable("places", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  address: text("address"),
  imageUrl: text("image_url"),
  entryFee: text("entry_fee"),
  visitDuration: text("visit_duration"),
  bestTime: text("best_time"),
  aiArticle: text("ai_article"),
  avgRating: real("avg_rating").default(0),
  reviewCount: integer("review_count").default(0),
  isPopular: boolean("is_popular").default(false),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const placesRelations = relations(places, ({ many }) => ({
  reviews: many(reviews),
  favorites: many(favorites),
  visitedPlaces: many(visitedPlaces),
}));

export const reviews = pgTable("reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  placeId: varchar("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  content: text("content"),
  photos: jsonb("photos").$type<string[]>().default([]),
  visitDate: timestamp("visit_date"),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [reviews.placeId],
    references: [places.id],
  }),
}));

export const favorites = pgTable("favorites", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  placeId: varchar("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [favorites.placeId],
    references: [places.id],
  }),
}));

export const visitedPlaces = pgTable("visited_places", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  placeId: varchar("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
});

export const visitedPlacesRelations = relations(visitedPlaces, ({ one }) => ({
  user: one(users, {
    fields: [visitedPlaces.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [visitedPlaces.placeId],
    references: [places.id],
  }),
}));

export const routes = pgTable("routes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  routeType: text("route_type").notNull(),
  placeIds: jsonb("place_ids").$type<string[]>().default([]),
  startLatitude: real("start_latitude"),
  startLongitude: real("start_longitude"),
  estimatedDuration: integer("estimated_duration"),
  estimatedDistance: real("estimated_distance"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const routesRelations = relations(routes, ({ one }) => ({
  user: one(users, {
    fields: [routes.userId],
    references: [users.id],
  }),
}));

export const itineraries = pgTable("itineraries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  city: text("city"),
  country: text("country"),
  placeIds: jsonb("place_ids").$type<string[]>().default([]),
  routeType: text("route_type").default("walking"),
  availableHours: integer("available_hours").default(8),
  generatedSchedule: text("generated_schedule"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const itinerariesRelations = relations(itineraries, ({ one }) => ({
  user: one(users, {
    fields: [itineraries.userId],
    references: [users.id],
  }),
}));

export const achievements = pgTable("achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const follows = pgTable("follows", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatarPreset: true,
  bio: true,
});

export const insertPlaceSchema = createInsertSchema(places).omit({
  id: true,
  createdAt: true,
  avgRating: true,
  reviewCount: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  likesCount: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertVisitedPlaceSchema = createInsertSchema(visitedPlaces).omit({
  id: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertItinerarySchema = createInsertSchema(itineraries).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof places.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertVisitedPlace = z.infer<typeof insertVisitedPlaceSchema>;
export type VisitedPlace = typeof visitedPlaces.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
export type Itinerary = typeof itineraries.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
