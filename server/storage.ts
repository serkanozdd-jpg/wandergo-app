import {
  users,
  places,
  reviews,
  favorites,
  visitedPlaces,
  routes,
  itineraries,
  achievements,
  follows,
  type User,
  type InsertUser,
  type Place,
  type InsertPlace,
  type Review,
  type InsertReview,
  type Favorite,
  type InsertFavorite,
  type VisitedPlace,
  type InsertVisitedPlace,
  type Route,
  type InsertRoute,
  type Itinerary,
  type InsertItinerary,
  type Achievement,
  type InsertAchievement,
  type Follow,
  type InsertFollow,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  getPlaces(options?: { city?: string; category?: string; search?: string; limit?: number }): Promise<Place[]>;
  getPlace(id: string): Promise<Place | undefined>;
  getNearbyPlaces(lat: number, lng: number, radiusKm?: number, limit?: number): Promise<Place[]>;
  getPopularPlaces(limit?: number): Promise<Place[]>;
  createPlace(place: InsertPlace): Promise<Place>;
  updatePlace(id: string, data: Partial<InsertPlace>): Promise<Place | undefined>;
  
  getReviews(placeId: string): Promise<(Review & { user: User })[]>;
  getReviewsByUser(userId: string): Promise<(Review & { place: Place })[]>;
  getCommunityReviews(limit?: number): Promise<(Review & { user: User; place: Place })[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  getFavorites(userId: string): Promise<(Favorite & { place: Place })[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, placeId: string): Promise<boolean>;
  isFavorite(userId: string, placeId: string): Promise<boolean>;
  
  getVisitedPlaces(userId: string): Promise<(VisitedPlace & { place: Place })[]>;
  addVisitedPlace(visitedPlace: InsertVisitedPlace): Promise<VisitedPlace>;
  getUserStats(userId: string): Promise<{ placesVisited: number; countriesVisited: number; reviewsCount: number }>;
  
  getRoutes(userId: string): Promise<Route[]>;
  getRoute(id: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  deleteRoute(id: string): Promise<boolean>;
  
  getItineraries(userId: string): Promise<Itinerary[]>;
  getItinerary(id: string): Promise<Itinerary | undefined>;
  createItinerary(itinerary: InsertItinerary): Promise<Itinerary>;
  updateItinerary(id: string, data: Partial<InsertItinerary>): Promise<Itinerary | undefined>;
  deleteItinerary(id: string): Promise<boolean>;
  
  getAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  checkAndAwardAchievements(userId: string): Promise<Achievement[]>;
  
  getFollowers(userId: string): Promise<(Follow & { follower: User })[]>;
  getFollowing(userId: string): Promise<(Follow & { following: User })[]>;
  followUser(follow: InsertFollow): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getPlaces(options?: { city?: string; category?: string; search?: string; limit?: number }): Promise<Place[]> {
    let query = db.select().from(places);
    const conditions = [];
    
    if (options?.city) {
      conditions.push(ilike(places.city, `%${options.city}%`));
    }
    if (options?.category) {
      conditions.push(eq(places.category, options.category));
    }
    if (options?.search) {
      conditions.push(
        or(
          ilike(places.name, `%${options.search}%`),
          ilike(places.description, `%${options.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    const result = await query.orderBy(desc(places.avgRating)).limit(options?.limit || 50);
    return result;
  }

  async getPlace(id: string): Promise<Place | undefined> {
    const [place] = await db.select().from(places).where(eq(places.id, id));
    return place || undefined;
  }

  async getNearbyPlaces(lat: number, lng: number, radiusKm: number = 10, limit: number = 20): Promise<Place[]> {
    const result = await db.select().from(places)
      .where(
        sql`(
          6371 * acos(
            cos(radians(${lat})) * cos(radians(${places.latitude})) *
            cos(radians(${places.longitude}) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(${places.latitude}))
          )
        ) <= ${radiusKm}`
      )
      .orderBy(desc(places.avgRating))
      .limit(limit);
    return result;
  }

  async getPopularPlaces(limit: number = 10): Promise<Place[]> {
    const result = await db.select().from(places)
      .where(eq(places.isPopular, true))
      .orderBy(desc(places.avgRating))
      .limit(limit);
    return result;
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    const [newPlace] = await db.insert(places).values(place).returning();
    return newPlace;
  }

  async updatePlace(id: string, data: Partial<InsertPlace>): Promise<Place | undefined> {
    const [place] = await db.update(places).set(data).where(eq(places.id, id)).returning();
    return place || undefined;
  }

  async getReviews(placeId: string): Promise<(Review & { user: User })[]> {
    const result = await db.select({
      review: reviews,
      user: users,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.placeId, placeId))
    .orderBy(desc(reviews.createdAt));
    
    return result.map(r => ({ ...r.review, user: r.user }));
  }

  async getReviewsByUser(userId: string): Promise<(Review & { place: Place })[]> {
    const result = await db.select({
      review: reviews,
      place: places,
    })
    .from(reviews)
    .innerJoin(places, eq(reviews.placeId, places.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
    
    return result.map(r => ({ ...r.review, place: r.place }));
  }

  async getCommunityReviews(limit: number = 20): Promise<(Review & { user: User; place: Place })[]> {
    const result = await db.select({
      review: reviews,
      user: users,
      place: places,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(places, eq(reviews.placeId, places.id))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
    
    return result.map(r => ({ ...r.review, user: r.user, place: r.place }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    const placeReviews = await db.select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.placeId, review.placeId));
    
    const avgRating = placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length;
    
    await db.update(places)
      .set({ 
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: placeReviews.length
      })
      .where(eq(places.id, review.placeId));
    
    return newReview;
  }

  async getFavorites(userId: string): Promise<(Favorite & { place: Place })[]> {
    const result = await db.select({
      favorite: favorites,
      place: places,
    })
    .from(favorites)
    .innerJoin(places, eq(favorites.placeId, places.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
    
    return result.map(r => ({ ...r.favorite, place: r.place }));
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const existing = await db.select().from(favorites)
      .where(and(
        eq(favorites.userId, favorite.userId),
        eq(favorites.placeId, favorite.placeId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, placeId: string): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.placeId, placeId)));
    return true;
  }

  async isFavorite(userId: string, placeId: string): Promise<boolean> {
    const result = await db.select().from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.placeId, placeId)));
    return result.length > 0;
  }

  async getVisitedPlaces(userId: string): Promise<(VisitedPlace & { place: Place })[]> {
    const result = await db.select({
      visitedPlace: visitedPlaces,
      place: places,
    })
    .from(visitedPlaces)
    .innerJoin(places, eq(visitedPlaces.placeId, places.id))
    .where(eq(visitedPlaces.userId, userId))
    .orderBy(desc(visitedPlaces.visitedAt));
    
    return result.map(r => ({ ...r.visitedPlace, place: r.place }));
  }

  async addVisitedPlace(visitedPlace: InsertVisitedPlace): Promise<VisitedPlace> {
    const existing = await db.select().from(visitedPlaces)
      .where(and(
        eq(visitedPlaces.userId, visitedPlace.userId),
        eq(visitedPlaces.placeId, visitedPlace.placeId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newVisitedPlace] = await db.insert(visitedPlaces).values(visitedPlace).returning();
    return newVisitedPlace;
  }

  async getUserStats(userId: string): Promise<{ placesVisited: number; countriesVisited: number; reviewsCount: number }> {
    const visited = await db.select({
      place: places,
    })
    .from(visitedPlaces)
    .innerJoin(places, eq(visitedPlaces.placeId, places.id))
    .where(eq(visitedPlaces.userId, userId));
    
    const countries = new Set(visited.map(v => v.place.country));
    
    const userReviews = await db.select().from(reviews).where(eq(reviews.userId, userId));
    
    return {
      placesVisited: visited.length,
      countriesVisited: countries.size,
      reviewsCount: userReviews.length,
    };
  }

  async getRoutes(userId: string): Promise<Route[]> {
    const result = await db.select().from(routes)
      .where(eq(routes.userId, userId))
      .orderBy(desc(routes.createdAt));
    return result;
  }

  async getRoute(id: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const [newRoute] = await db.insert(routes).values(route).returning();
    return newRoute;
  }

  async deleteRoute(id: string): Promise<boolean> {
    await db.delete(routes).where(eq(routes.id, id));
    return true;
  }

  async getItineraries(userId: string): Promise<Itinerary[]> {
    const result = await db.select().from(itineraries)
      .where(eq(itineraries.userId, userId))
      .orderBy(desc(itineraries.date));
    return result;
  }

  async getItinerary(id: string): Promise<Itinerary | undefined> {
    const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.id, id));
    return itinerary || undefined;
  }

  async createItinerary(itinerary: InsertItinerary): Promise<Itinerary> {
    const [newItinerary] = await db.insert(itineraries).values(itinerary).returning();
    return newItinerary;
  }

  async updateItinerary(id: string, data: Partial<InsertItinerary>): Promise<Itinerary | undefined> {
    const [itinerary] = await db.update(itineraries).set(data).where(eq(itineraries.id, id)).returning();
    return itinerary || undefined;
  }

  async deleteItinerary(id: string): Promise<boolean> {
    await db.delete(itineraries).where(eq(itineraries.id, id));
    return true;
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const result = await db.select().from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt));
    return result;
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const existing = await db.select().from(achievements)
      .where(and(
        eq(achievements.userId, achievement.userId),
        eq(achievements.type, achievement.type)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    const stats = await this.getUserStats(userId);
    const existingAchievements = await this.getAchievements(userId);
    const existingTypes = new Set(existingAchievements.map(a => a.type));
    
    const achievementDefinitions = [
      { type: "first_visit", title: "First Steps", description: "Visited your first place", icon: "map-pin", condition: () => stats.placesVisited >= 1 },
      { type: "explorer_10", title: "Explorer", description: "Visited 10 places", icon: "compass", condition: () => stats.placesVisited >= 10 },
      { type: "globetrotter_50", title: "Globetrotter", description: "Visited 50 places", icon: "globe", condition: () => stats.placesVisited >= 50 },
      { type: "first_country", title: "Border Crosser", description: "Explored your first country", icon: "flag", condition: () => stats.countriesVisited >= 1 },
      { type: "world_traveler_5", title: "World Traveler", description: "Visited 5 countries", icon: "map", condition: () => stats.countriesVisited >= 5 },
      { type: "first_review", title: "Critic", description: "Wrote your first review", icon: "edit", condition: () => stats.reviewsCount >= 1 },
      { type: "reviewer_10", title: "Storyteller", description: "Wrote 10 reviews", icon: "book-open", condition: () => stats.reviewsCount >= 10 },
    ];
    
    for (const def of achievementDefinitions) {
      if (!existingTypes.has(def.type) && def.condition()) {
        const achievement = await this.createAchievement({
          userId,
          type: def.type,
          title: def.title,
          description: def.description,
          icon: def.icon,
        });
        newAchievements.push(achievement);
      }
    }
    
    return newAchievements;
  }

  async getFollowers(userId: string): Promise<(Follow & { follower: User })[]> {
    const result = await db.select({
      follow: follows,
      follower: users,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt));
    
    return result.map(r => ({ ...r.follow, follower: r.follower }));
  }

  async getFollowing(userId: string): Promise<(Follow & { following: User })[]> {
    const result = await db.select({
      follow: follows,
      following: users,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(follows.createdAt));
    
    return result.map(r => ({ ...r.follow, following: r.following }));
  }

  async followUser(follow: InsertFollow): Promise<Follow> {
    const existing = await db.select().from(follows)
      .where(and(
        eq(follows.followerId, follow.followerId),
        eq(follows.followingId, follow.followingId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newFollow] = await db.insert(follows).values(follow).returning();
    return newFollow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    await db.delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return true;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
