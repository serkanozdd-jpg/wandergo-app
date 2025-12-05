import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";

const CACHE_PREFIX = "@wandergo_cache:";
const CACHE_EXPIRY_PREFIX = "@wandergo_expiry:";
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000;
const OFFLINE_QUEUE_KEY = "@wandergo_offline_queue";

export type CacheableData = {
  places: unknown[];
  place: Record<string, unknown>;
  routes: unknown[];
  route: Record<string, unknown>;
  favorites: unknown[];
  visited: unknown[];
  itineraries: unknown[];
  itinerary: Record<string, unknown>;
  popular_places: unknown[];
  nearby_places: unknown[];
  achievements: unknown[];
};

type QueuedAction = {
  id: string;
  type: "create_review" | "mark_visited" | "add_favorite" | "remove_favorite";
  data: unknown;
  timestamp: number;
};

let isOnline = true;
let networkListeners: ((online: boolean) => void)[] = [];
let queueListeners: ((count: number) => void)[] = [];
let pollingInterval: ReturnType<typeof setInterval> | null = null;

async function pollNetworkStatus(): Promise<void> {
  try {
    const state = await Network.getNetworkStateAsync();
    const newOnlineState = state.isConnected === true && state.isInternetReachable !== false;
    if (isOnline !== newOnlineState) {
      isOnline = newOnlineState;
      networkListeners.forEach((listener) => listener(isOnline));
      if (isOnline) {
        processOfflineQueue();
      }
    }
  } catch {
    // Keep existing state on error
  }
}

function startNetworkPolling(): void {
  if (pollingInterval) return;
  pollNetworkStatus();
  pollingInterval = setInterval(pollNetworkStatus, 5000);
}

function stopNetworkPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

startNetworkPolling();

export function subscribeToNetworkStatus(listener: (online: boolean) => void): () => void {
  networkListeners.push(listener);
  return () => {
    networkListeners = networkListeners.filter((l) => l !== listener);
    if (networkListeners.length === 0) {
      stopNetworkPolling();
    }
  };
}

export function subscribeToQueueChanges(listener: (count: number) => void): () => void {
  queueListeners.push(listener);
  return () => {
    queueListeners = queueListeners.filter((l) => l !== listener);
  };
}

async function notifyQueueChange(): Promise<void> {
  const queue = await getOfflineQueue();
  queueListeners.forEach((listener) => listener(queue.length));
}

export async function checkNetworkStatus(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    isOnline = state.isConnected === true && state.isInternetReachable !== false;
    return isOnline;
  } catch {
    return isOnline;
  }
}

export function getNetworkStatus(): boolean {
  return isOnline;
}

export async function cacheData<K extends keyof CacheableData>(
  key: K,
  identifier: string,
  data: CacheableData[K],
  duration: number = DEFAULT_CACHE_DURATION
): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}:${identifier}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}:${identifier}`;
    const expiry = Date.now() + duration;

    await AsyncStorage.multiSet([
      [cacheKey, JSON.stringify(data)],
      [expiryKey, expiry.toString()],
    ]);
  } catch (error) {
    console.error("Failed to cache data:", error);
  }
}

export async function getCachedData<K extends keyof CacheableData>(
  key: K,
  identifier: string
): Promise<CacheableData[K] | null> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}:${identifier}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}:${identifier}`;

    const [[, data], [, expiry]] = await AsyncStorage.multiGet([cacheKey, expiryKey]);

    if (!data || !expiry) return null;

    const expiryTime = parseInt(expiry, 10);
    if (Date.now() > expiryTime) {
      await AsyncStorage.multiRemove([cacheKey, expiryKey]);
      return null;
    }

    return JSON.parse(data) as CacheableData[K];
  } catch (error) {
    console.error("Failed to get cached data:", error);
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
    );
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
}

export async function getCacheSize(): Promise<{ count: number; keys: string[] }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    return { count: cacheKeys.length, keys: cacheKeys };
  } catch {
    return { count: 0, keys: [] };
  }
}

export async function addToOfflineQueue(action: Omit<QueuedAction, "id" | "timestamp">): Promise<void> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: QueuedAction[] = queueStr ? JSON.parse(queueStr) : [];

    queue.push({
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    });

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    await notifyQueueChange();
  } catch (error) {
    console.error("Failed to add to offline queue:", error);
  }
}

export async function getOfflineQueue(): Promise<QueuedAction[]> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch {
    return [];
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    await notifyQueueChange();
  } catch (error) {
    console.error("Failed to clear offline queue:", error);
  }
}

export async function removeFromOfflineQueue(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const updatedQueue = queue.filter((action) => action.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    await notifyQueueChange();
  } catch (error) {
    console.error("Failed to remove from offline queue:", error);
  }
}

async function processOfflineQueue(): Promise<void> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  const { authFetch } = await import("./api");

  for (const action of queue) {
    try {
      let success = false;

      switch (action.type) {
        case "mark_visited": {
          const { placeId } = action.data as { placeId: string };
          const res = await authFetch(`/api/visited/${placeId}`, { method: "POST" });
          success = res.ok;
          break;
        }
        case "add_favorite": {
          const { placeId } = action.data as { placeId: string };
          const res = await authFetch(`/api/favorites/${placeId}`, { method: "POST" });
          success = res.ok;
          break;
        }
        case "remove_favorite": {
          const { placeId } = action.data as { placeId: string };
          const res = await authFetch(`/api/favorites/${placeId}`, { method: "DELETE" });
          success = res.ok;
          break;
        }
        case "create_review": {
          const { placeId, ...reviewData } = action.data as { placeId: string; rating: number; content?: string };
          const res = await authFetch(`/api/places/${placeId}/reviews`, {
            method: "POST",
            body: JSON.stringify(reviewData),
          });
          success = res.ok;
          break;
        }
      }

      if (success) {
        await removeFromOfflineQueue(action.id);
      }
    } catch (error) {
      console.error(`Failed to process queued action ${action.type}:`, error);
    }
  }
}

export async function savePlacesForOffline(places: unknown[]): Promise<void> {
  await cacheData("places", "all", places, 7 * 24 * 60 * 60 * 1000);
  for (const place of places as { id: string }[]) {
    await cacheData("place", place.id, place);
  }
}

export async function saveRoutesForOffline(routes: unknown[]): Promise<void> {
  await cacheData("routes", "user", routes, 7 * 24 * 60 * 60 * 1000);
  for (const route of routes as { id: string }[]) {
    await cacheData("route", route.id, route);
  }
}

export async function saveItinerariesForOffline(itineraries: unknown[]): Promise<void> {
  await cacheData("itineraries", "user", itineraries, 7 * 24 * 60 * 60 * 1000);
  for (const itinerary of itineraries as { id: string }[]) {
    await cacheData("itinerary", itinerary.id, itinerary);
  }
}

export async function getOfflinePlaces(): Promise<unknown[] | null> {
  return getCachedData("places", "all");
}

export async function getOfflinePlace(id: string): Promise<Record<string, unknown> | null> {
  return getCachedData("place", id);
}

export async function getOfflineRoutes(): Promise<unknown[] | null> {
  return getCachedData("routes", "user");
}

export async function getOfflineRoute(id: string): Promise<Record<string, unknown> | null> {
  return getCachedData("route", id);
}

export async function getOfflineItineraries(): Promise<unknown[] | null> {
  return getCachedData("itineraries", "user");
}

export async function getOfflineItinerary(id: string): Promise<Record<string, unknown> | null> {
  return getCachedData("itinerary", id);
}
