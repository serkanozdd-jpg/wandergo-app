import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { authenticate, optionalAuth, login, register } from "./auth";
import { generatePlaceArticle, generateDailyItinerary } from "./ai";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, displayName } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
      const result = await register(username, password, displayName);
      
      if (!result) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
      const result = await login(username, password);
      
      if (!result) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const stats = await storage.getUserStats(req.user!.id);
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarPreset: user.avatarPreset,
        bio: user.bio,
        ...stats,
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.put("/api/auth/profile", authenticate, async (req, res) => {
    try {
      const { displayName, avatarPreset, bio } = req.body;
      const user = await storage.updateUser(req.user!.id, { displayName, avatarPreset, bio });
      res.json(user);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/places", optionalAuth, async (req, res) => {
    try {
      const { city, category, search, limit } = req.query;
      const places = await storage.getPlaces({
        city: city as string,
        category: category as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(places);
    } catch (error) {
      console.error("Get places error:", error);
      res.status(500).json({ error: "Failed to get places" });
    }
  });

  app.get("/api/places/nearby", optionalAuth, async (req, res) => {
    try {
      const { lat, lng, radius, limit } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }
      
      const places = await storage.getNearbyPlaces(
        parseFloat(lat as string),
        parseFloat(lng as string),
        radius ? parseFloat(radius as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(places);
    } catch (error) {
      console.error("Get nearby places error:", error);
      res.status(500).json({ error: "Failed to get nearby places" });
    }
  });

  app.get("/api/places/popular", async (req, res) => {
    try {
      const { limit } = req.query;
      const places = await storage.getPopularPlaces(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(places);
    } catch (error) {
      console.error("Get popular places error:", error);
      res.status(500).json({ error: "Failed to get popular places" });
    }
  });

  app.get("/api/places/:id", optionalAuth, async (req, res) => {
    try {
      const place = await storage.getPlace(req.params.id);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }
      
      let isFavorite = false;
      if (req.user) {
        isFavorite = await storage.isFavorite(req.user.id, place.id);
      }
      
      res.json({ ...place, isFavorite });
    } catch (error) {
      console.error("Get place error:", error);
      res.status(500).json({ error: "Failed to get place" });
    }
  });

  app.post("/api/places/:id/article", async (req, res) => {
    try {
      const place = await storage.getPlace(req.params.id);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }
      
      const article = await generatePlaceArticle(
        place.name,
        place.city,
        place.country,
        place.category,
        place.description || undefined
      );
      
      await storage.updatePlace(place.id, { aiArticle: article });
      
      res.json({ article });
    } catch (error) {
      console.error("Generate article error:", error);
      res.status(500).json({ error: "Failed to generate article" });
    }
  });

  app.get("/api/places/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  app.post("/api/places/:id/reviews", authenticate, async (req, res) => {
    try {
      const { rating, content, photos, visitDate } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }
      
      const review = await storage.createReview({
        userId: req.user!.id,
        placeId: req.params.id,
        rating,
        content,
        photos: photos || [],
        visitDate: visitDate ? new Date(visitDate) : undefined,
      });
      
      await storage.addVisitedPlace({
        userId: req.user!.id,
        placeId: req.params.id,
      });
      
      res.json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/reviews/community", async (req, res) => {
    try {
      const { limit } = req.query;
      const reviews = await storage.getCommunityReviews(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(reviews);
    } catch (error) {
      console.error("Get community reviews error:", error);
      res.status(500).json({ error: "Failed to get community reviews" });
    }
  });

  app.get("/api/favorites", authenticate, async (req, res) => {
    try {
      const favorites = await storage.getFavorites(req.user!.id);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });

  app.post("/api/favorites/:placeId", authenticate, async (req, res) => {
    try {
      const favorite = await storage.addFavorite({
        userId: req.user!.id,
        placeId: req.params.placeId,
      });
      res.json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:placeId", authenticate, async (req, res) => {
    try {
      await storage.removeFavorite(req.user!.id, req.params.placeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/visited", authenticate, async (req, res) => {
    try {
      const visited = await storage.getVisitedPlaces(req.user!.id);
      res.json(visited);
    } catch (error) {
      console.error("Get visited places error:", error);
      res.status(500).json({ error: "Failed to get visited places" });
    }
  });

  app.post("/api/visited/:placeId", authenticate, async (req, res) => {
    try {
      const visited = await storage.addVisitedPlace({
        userId: req.user!.id,
        placeId: req.params.placeId,
      });
      res.json(visited);
    } catch (error) {
      console.error("Add visited place error:", error);
      res.status(500).json({ error: "Failed to add visited place" });
    }
  });

  app.get("/api/routes", authenticate, async (req, res) => {
    try {
      const routes = await storage.getRoutes(req.user!.id);
      res.json(routes);
    } catch (error) {
      console.error("Get routes error:", error);
      res.status(500).json({ error: "Failed to get routes" });
    }
  });

  app.get("/api/routes/:id", authenticate, async (req, res) => {
    try {
      const route = await storage.getRoute(req.params.id);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      console.error("Get route error:", error);
      res.status(500).json({ error: "Failed to get route" });
    }
  });

  app.post("/api/routes", authenticate, async (req, res) => {
    try {
      const { name, description, routeType, placeIds, startLatitude, startLongitude, estimatedDuration, estimatedDistance, isPublic } = req.body;
      
      if (!name || !routeType || !placeIds) {
        return res.status(400).json({ error: "Name, route type, and place IDs required" });
      }
      
      const route = await storage.createRoute({
        userId: req.user!.id,
        name,
        description,
        routeType,
        placeIds,
        startLatitude,
        startLongitude,
        estimatedDuration,
        estimatedDistance,
        isPublic: isPublic || false,
      });
      
      res.json(route);
    } catch (error) {
      console.error("Create route error:", error);
      res.status(500).json({ error: "Failed to create route" });
    }
  });

  app.delete("/api/routes/:id", authenticate, async (req, res) => {
    try {
      await storage.deleteRoute(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete route error:", error);
      res.status(500).json({ error: "Failed to delete route" });
    }
  });

  app.post("/api/routes/generate-itinerary", authenticate, async (req, res) => {
    try {
      const { placeIds, routeType, availableHours } = req.body;
      
      if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
        return res.status(400).json({ error: "Place IDs required" });
      }
      
      const places = await Promise.all(
        placeIds.map((id: string) => storage.getPlace(id))
      );
      
      const validPlaces = places.filter(p => p !== undefined).map(p => ({
        name: p!.name,
        category: p!.category,
        visitDuration: p!.visitDuration,
      }));
      
      const itinerary = await generateDailyItinerary(
        validPlaces,
        routeType || "walking",
        availableHours || 8
      );
      
      res.json({ itinerary });
    } catch (error) {
      console.error("Generate itinerary error:", error);
      res.status(500).json({ error: "Failed to generate itinerary" });
    }
  });

  app.get("/api/itineraries", authenticate, async (req, res) => {
    try {
      const itineraries = await storage.getItineraries(req.user!.id);
      res.json(itineraries);
    } catch (error) {
      console.error("Get itineraries error:", error);
      res.status(500).json({ error: "Failed to get itineraries" });
    }
  });

  app.get("/api/itineraries/:id", authenticate, async (req, res) => {
    try {
      const itinerary = await storage.getItinerary(req.params.id);
      if (!itinerary) {
        return res.status(404).json({ error: "Itinerary not found" });
      }
      if (itinerary.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(itinerary);
    } catch (error) {
      console.error("Get itinerary error:", error);
      res.status(500).json({ error: "Failed to get itinerary" });
    }
  });

  app.post("/api/itineraries", authenticate, async (req, res) => {
    try {
      const { title, date, city, country, placeIds, routeType, availableHours } = req.body;
      
      if (!title || !date || !placeIds) {
        return res.status(400).json({ error: "Title, date, and place IDs required" });
      }
      
      if (!Array.isArray(placeIds) || placeIds.length === 0) {
        return res.status(400).json({ error: "At least one place ID is required" });
      }
      
      const places = await Promise.all(
        placeIds.map((id: string) => storage.getPlace(id))
      );
      
      const validPlaces = places.filter(p => p !== undefined).map(p => ({
        name: p!.name,
        category: p!.category,
        visitDuration: p!.visitDuration,
      }));
      
      if (validPlaces.length === 0) {
        return res.status(400).json({ error: "No valid places found for the provided IDs" });
      }
      
      const generatedSchedule = await generateDailyItinerary(
        validPlaces,
        routeType || "walking",
        availableHours || 8
      );
      
      const itinerary = await storage.createItinerary({
        userId: req.user!.id,
        title,
        date: new Date(date),
        city,
        country,
        placeIds,
        routeType: routeType || "walking",
        availableHours: availableHours || 8,
        generatedSchedule,
      });
      
      res.json(itinerary);
    } catch (error) {
      console.error("Create itinerary error:", error);
      res.status(500).json({ error: "Failed to create itinerary" });
    }
  });

  app.put("/api/itineraries/:id", authenticate, async (req, res) => {
    try {
      const existingItinerary = await storage.getItinerary(req.params.id);
      if (!existingItinerary) {
        return res.status(404).json({ error: "Itinerary not found" });
      }
      if (existingItinerary.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { isCompleted } = req.body;
      const itinerary = await storage.updateItinerary(req.params.id, { isCompleted });
      res.json(itinerary);
    } catch (error) {
      console.error("Update itinerary error:", error);
      res.status(500).json({ error: "Failed to update itinerary" });
    }
  });

  app.delete("/api/itineraries/:id", authenticate, async (req, res) => {
    try {
      const existingItinerary = await storage.getItinerary(req.params.id);
      if (!existingItinerary) {
        return res.status(404).json({ error: "Itinerary not found" });
      }
      if (existingItinerary.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteItinerary(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete itinerary error:", error);
      res.status(500).json({ error: "Failed to delete itinerary" });
    }
  });

  app.get("/api/achievements", authenticate, async (req, res) => {
    try {
      const achievements = await storage.getAchievements(req.user!.id);
      res.json(achievements);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: "Failed to get achievements" });
    }
  });

  app.post("/api/achievements/check", authenticate, async (req, res) => {
    try {
      const newAchievements = await storage.checkAndAwardAchievements(req.user!.id);
      res.json(newAchievements);
    } catch (error) {
      console.error("Check achievements error:", error);
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  app.get("/api/users/:id", optionalAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const stats = await storage.getUserStats(req.params.id);
      let isFollowing = false;
      if (req.user && req.user.id !== req.params.id) {
        isFollowing = await storage.isFollowing(req.user.id, req.params.id);
      }
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarPreset: user.avatarPreset,
        bio: user.bio,
        ...stats,
        isFollowing,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.id);
      res.json(followers);
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ error: "Failed to get followers" });
    }
  });

  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.id);
      res.json(following);
    } catch (error) {
      console.error("Get following error:", error);
      res.status(500).json({ error: "Failed to get following" });
    }
  });

  app.post("/api/users/:id/follow", authenticate, async (req, res) => {
    try {
      if (req.user!.id === req.params.id) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      const follow = await storage.followUser({
        followerId: req.user!.id,
        followingId: req.params.id,
      });
      res.json(follow);
    } catch (error) {
      console.error("Follow user error:", error);
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:id/follow", authenticate, async (req, res) => {
    try {
      await storage.unfollowUser(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Unfollow user error:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  app.get("/api/routes/public", optionalAuth, async (req, res) => {
    try {
      const { limit } = req.query;
      const allPublicRoutes: any[] = [];
      const users = await Promise.all([]);
      res.json(allPublicRoutes.slice(0, parseInt(limit as string) || 20));
    } catch (error) {
      console.error("Get public routes error:", error);
      res.status(500).json({ error: "Failed to get public routes" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", authenticate, async (req, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", authenticate, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/review-photos", authenticate, async (req, res) => {
    if (!req.body.photoURL) {
      return res.status(400).json({ error: "photoURL is required" });
    }
    const userId = req.user!.id;
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.photoURL,
        {
          owner: userId,
          visibility: "public",
        }
      );
      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting review photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
