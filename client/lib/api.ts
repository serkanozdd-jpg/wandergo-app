import { getApiUrl } from "@/lib/query-client";
import { getAuthToken } from "@/lib/auth";

export async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    ...options,
    headers,
  });
  
  return res;
}

export async function getPlaces(options?: {
  city?: string;
  category?: string;
  search?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.city) params.append("city", options.city);
  if (options?.category) params.append("category", options.category);
  if (options?.search) params.append("search", options.search);
  if (options?.limit) params.append("limit", options.limit.toString());
  
  const res = await authFetch(`/api/places?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch places");
  return res.json();
}

export async function getNearbyPlaces(lat: number, lng: number, radius?: number, limit?: number) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
  });
  if (radius) params.append("radius", radius.toString());
  if (limit) params.append("limit", limit.toString());
  
  const res = await authFetch(`/api/places/nearby?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch nearby places");
  return res.json();
}

export async function getPopularPlaces(limit?: number) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  
  const res = await authFetch(`/api/places/popular?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch popular places");
  return res.json();
}

export async function getPlace(id: string) {
  const res = await authFetch(`/api/places/${id}`);
  if (!res.ok) throw new Error("Failed to fetch place");
  return res.json();
}

export async function generateArticle(placeId: string) {
  const res = await authFetch(`/api/places/${placeId}/article`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate article");
  return res.json();
}

export async function getPlaceReviews(placeId: string) {
  const res = await authFetch(`/api/places/${placeId}/reviews`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function createReview(placeId: string, data: {
  rating: number;
  content?: string;
  photos?: string[];
  visitDate?: string;
}) {
  const res = await authFetch(`/api/places/${placeId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create review");
  return res.json();
}

export async function getCommunityReviews(limit?: number) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  
  const res = await authFetch(`/api/reviews/community?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch community reviews");
  return res.json();
}

export async function getFavorites() {
  const res = await authFetch("/api/favorites");
  if (!res.ok) throw new Error("Failed to fetch favorites");
  return res.json();
}

export async function addFavorite(placeId: string) {
  const res = await authFetch(`/api/favorites/${placeId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to add favorite");
  return res.json();
}

export async function removeFavorite(placeId: string) {
  const res = await authFetch(`/api/favorites/${placeId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove favorite");
  return res.json();
}

export async function getVisitedPlaces() {
  const res = await authFetch("/api/visited");
  if (!res.ok) throw new Error("Failed to fetch visited places");
  return res.json();
}

export async function markVisited(placeId: string) {
  const res = await authFetch(`/api/visited/${placeId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to mark as visited");
  return res.json();
}

export async function getRoutes() {
  const res = await authFetch("/api/routes");
  if (!res.ok) throw new Error("Failed to fetch routes");
  return res.json();
}

export async function getRoute(id: string) {
  const res = await authFetch(`/api/routes/${id}`);
  if (!res.ok) throw new Error("Failed to fetch route");
  return res.json();
}

export async function createRoute(data: {
  name: string;
  description?: string;
  routeType: string;
  placeIds: string[];
  startLatitude?: number;
  startLongitude?: number;
  estimatedDuration?: number;
  estimatedDistance?: number;
  isPublic?: boolean;
}) {
  const res = await authFetch("/api/routes", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create route");
  return res.json();
}

export async function deleteRoute(id: string) {
  const res = await authFetch(`/api/routes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete route");
  return res.json();
}

export async function generateItinerary(placeIds: string[], routeType: string, availableHours?: number) {
  const res = await authFetch("/api/routes/generate-itinerary", {
    method: "POST",
    body: JSON.stringify({ placeIds, routeType, availableHours }),
  });
  if (!res.ok) throw new Error("Failed to generate itinerary");
  return res.json();
}

export async function getUploadUrl() {
  const res = await authFetch("/api/objects/upload", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  return res.json();
}

export async function setPhotoAcl(photoURL: string) {
  const res = await authFetch("/api/review-photos", {
    method: "PUT",
    body: JSON.stringify({ photoURL }),
  });
  if (!res.ok) throw new Error("Failed to set photo ACL");
  return res.json();
}
