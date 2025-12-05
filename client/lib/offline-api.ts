import {
  getNetworkStatus,
  savePlacesForOffline,
  saveRoutesForOffline,
  saveItinerariesForOffline,
  getOfflinePlaces,
  getOfflinePlace,
  getOfflineRoutes,
  getOfflineRoute,
  getOfflineItineraries,
  getOfflineItinerary,
  cacheData,
  getCachedData,
  addToOfflineQueue,
} from "./offline-storage";
import * as api from "./api";

type Place = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  entryFee?: string | null;
  visitDuration?: string | null;
  bestTime?: string | null;
  aiArticle?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
};

type Route = {
  id: string;
  name: string;
  description?: string | null;
  routeType: string;
  placeIds: string[];
  estimatedDuration?: number | null;
  estimatedDistance?: number | null;
};

type Itinerary = {
  id: string;
  title: string;
  date: string;
  city?: string | null;
  country?: string | null;
  placeIds: string[];
  schedule?: unknown;
  isCompleted: boolean;
};

export async function getPlacesWithOffline(options?: {
  city?: string;
  category?: string;
  search?: string;
  limit?: number;
}): Promise<Place[]> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const places = await api.getPlaces(options);
      if (!options || Object.keys(options).length === 0) {
        await savePlacesForOffline(places);
      }
      return places;
    } catch (error) {
      const cached = await getOfflinePlaces();
      if (cached) return cached as Place[];
      throw error;
    }
  }

  const cached = await getOfflinePlaces();
  if (cached) {
    let places = cached as Place[];
    if (options?.city) {
      places = places.filter((p) => p.city.toLowerCase().includes(options.city!.toLowerCase()));
    }
    if (options?.category) {
      places = places.filter((p) => p.category === options.category);
    }
    if (options?.search) {
      const search = options.search.toLowerCase();
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }
    if (options?.limit) {
      places = places.slice(0, options.limit);
    }
    return places;
  }

  throw new Error("No cached data available. Please connect to the internet.");
}

export async function getPlaceWithOffline(id: string): Promise<Place> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const place = await api.getPlace(id);
      await cacheData("place", id, place);
      return place;
    } catch (error) {
      const cached = await getOfflinePlace(id);
      if (cached) return cached as Place;
      throw error;
    }
  }

  const cached = await getOfflinePlace(id);
  if (cached) return cached as Place;

  throw new Error("Place not available offline.");
}

export async function getRoutesWithOffline(): Promise<Route[]> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const routes = await api.getRoutes();
      await saveRoutesForOffline(routes);
      return routes;
    } catch (error) {
      const cached = await getOfflineRoutes();
      if (cached) return cached as Route[];
      throw error;
    }
  }

  const cached = await getOfflineRoutes();
  if (cached) return cached as Route[];

  throw new Error("No cached routes available. Please connect to the internet.");
}

export async function getRouteWithOffline(id: string): Promise<Route> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const route = await api.getRoute(id);
      await cacheData("route", id, route);
      return route;
    } catch (error) {
      const cached = await getOfflineRoute(id);
      if (cached) return cached as Route;
      throw error;
    }
  }

  const cached = await getOfflineRoute(id);
  if (cached) return cached as Route;

  throw new Error("Route not available offline.");
}

export async function getItinerariesWithOffline(): Promise<Itinerary[]> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const itineraries = await api.getItineraries();
      await saveItinerariesForOffline(itineraries);
      return itineraries;
    } catch (error) {
      const cached = await getOfflineItineraries();
      if (cached) return cached as Itinerary[];
      throw error;
    }
  }

  const cached = await getOfflineItineraries();
  if (cached) return cached as Itinerary[];

  throw new Error("No cached itineraries available. Please connect to the internet.");
}

export async function getItineraryWithOffline(id: string): Promise<Itinerary> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const itinerary = await api.getItinerary(id);
      await cacheData("itinerary", id, itinerary);
      return itinerary;
    } catch (error) {
      const cached = await getOfflineItinerary(id);
      if (cached) return cached as Itinerary;
      throw error;
    }
  }

  const cached = await getOfflineItinerary(id);
  if (cached) return cached as Itinerary;

  throw new Error("Itinerary not available offline.");
}

export async function getFavoritesWithOffline(): Promise<unknown[]> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const favorites = await api.getFavorites();
      await cacheData("favorites", "user", favorites);
      return favorites;
    } catch (error) {
      const cached = await getCachedData("favorites", "user");
      if (cached) return cached as unknown[];
      throw error;
    }
  }

  const cached = await getCachedData("favorites", "user");
  if (cached) return cached as unknown[];

  throw new Error("No cached favorites available. Please connect to the internet.");
}

export async function getVisitedWithOffline(): Promise<unknown[]> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const visited = await api.getVisitedPlaces();
      await cacheData("visited", "user", visited);
      return visited;
    } catch (error) {
      const cached = await getCachedData("visited", "user");
      if (cached) return cached as unknown[];
      throw error;
    }
  }

  const cached = await getCachedData("visited", "user");
  if (cached) return cached as unknown[];

  throw new Error("No cached visited places available. Please connect to the internet.");
}

export async function markVisitedWithOffline(placeId: string): Promise<unknown> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    return api.markVisited(placeId);
  }

  await addToOfflineQueue({
    type: "mark_visited",
    data: { placeId },
  });

  return { queued: true, message: "Action will be synced when online" };
}

export async function addFavoriteWithOffline(placeId: string): Promise<unknown> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    return api.addFavorite(placeId);
  }

  await addToOfflineQueue({
    type: "add_favorite",
    data: { placeId },
  });

  return { queued: true, message: "Action will be synced when online" };
}

export async function removeFavoriteWithOffline(placeId: string): Promise<unknown> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    return api.removeFavorite(placeId);
  }

  await addToOfflineQueue({
    type: "remove_favorite",
    data: { placeId },
  });

  return { queued: true, message: "Action will be synced when online" };
}

export async function getPopularPlacesWithOffline(limit?: number): Promise<Place[]> {
  const isOnline = getNetworkStatus();
  const cacheKey = `popular_${limit || 10}`;

  if (isOnline) {
    try {
      const places = await api.getPopularPlaces(limit);
      await cacheData("popular_places", cacheKey, places);
      return places;
    } catch (error) {
      const cached = await getCachedData("popular_places", cacheKey);
      if (cached) return cached as Place[];
      throw error;
    }
  }

  const cached = await getCachedData("popular_places", cacheKey);
  if (cached) return cached as Place[];

  const allPlaces = await getOfflinePlaces();
  if (allPlaces) {
    const sortedByRating = (allPlaces as Place[])
      .filter((p) => p.avgRating != null)
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, limit || 10);
    return sortedByRating;
  }

  throw new Error("No cached popular places available. Please connect to the internet.");
}

export async function getNearbyPlacesWithOffline(
  lat: number,
  lng: number,
  radiusKm?: number,
  limit?: number
): Promise<Place[]> {
  const isOnline = getNetworkStatus();
  const cacheKey = `nearby_${lat.toFixed(2)}_${lng.toFixed(2)}`;

  if (isOnline) {
    try {
      const places = await api.getNearbyPlaces(lat, lng, radiusKm, limit);
      await cacheData("nearby_places", cacheKey, places);
      return places;
    } catch (error) {
      const cached = await getCachedData("nearby_places", cacheKey);
      if (cached) return cached as Place[];
      throw error;
    }
  }

  const cached = await getCachedData("nearby_places", cacheKey);
  if (cached) return cached as Place[];

  const allPlaces = await getOfflinePlaces();
  if (allPlaces) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const placesWithDistance = (allPlaces as Place[])
      .map((p) => ({
        ...p,
        distance: haversine(lat, lng, p.latitude, p.longitude),
      }))
      .filter((p) => p.distance <= (radiusKm || 20))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit || 10);

    return placesWithDistance;
  }

  throw new Error("No cached nearby places available. Please connect to the internet.");
}

export async function getAchievementsWithOffline(): Promise<unknown[]> {
  const isOnline = getNetworkStatus();

  if (isOnline) {
    try {
      const achievements = await api.getAchievements();
      await cacheData("achievements", "user", achievements);
      return achievements;
    } catch (error) {
      const cached = await getCachedData("achievements", "user");
      if (cached) return cached as unknown[];
      throw error;
    }
  }

  const cached = await getCachedData("achievements", "user");
  if (cached) return cached as unknown[];

  throw new Error("No cached achievements available. Please connect to the internet.");
}

export { api };
