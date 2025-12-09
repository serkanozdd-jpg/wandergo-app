import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

let GoogleMapsView: React.ComponentType<any> | null = null;
let AppleMapsView: React.ComponentType<any> | null = null;

if (Platform.OS !== "web") {
  try {
    const ExpoMaps = require("expo-maps");
    GoogleMapsView = ExpoMaps.GoogleMaps?.View;
    AppleMapsView = ExpoMaps.AppleMaps?.View;
  } catch (e) {
    console.log("expo-maps not available");
  }
}

import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { OfflineBadge } from "@/components/OfflineIndicator";
import { useTheme } from "@/hooks/useTheme";
import { useOffline } from "@/hooks/useOffline";
import { Spacing, BorderRadius } from "@/constants/theme";
import { checkAchievements } from "@/lib/api";
import { getAchievementsWithOffline, getVisitedWithOffline } from "@/lib/offline-api";

type Achievement = {
  id: string;
  type: string;
  name: string;
  description: string;
  badgeIcon: string;
  unlockedAt: string;
};

type Place = {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
};

type VisitedPlace = {
  id: string;
  placeId: string;
  visitedAt: string;
  place: Place;
};

const ACHIEVEMENT_ICONS: Record<string, { icon: string; color: string }> = {
  first_visit: { icon: "flag", color: "#27AE60" },
  explorer: { icon: "compass", color: "#3498DB" },
  city_expert: { icon: "award", color: "#9B59B6" },
  globetrotter: { icon: "globe", color: "#E67E22" },
  reviewer: { icon: "edit-3", color: "#E74C3C" },
  photographer: { icon: "camera", color: "#1ABC9C" },
  route_master: { icon: "map", color: "#F39C12" },
  social_butterfly: { icon: "users", color: "#E91E63" },
  default: { icon: "star", color: "#FFB800" },
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.35;

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isOnline } = useOffline();
  const mapRef = useRef<any>(null);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [achievementsData, visitedData] = await Promise.all([
        getAchievementsWithOffline(),
        getVisitedWithOffline(),
      ]);
      setAchievements(achievementsData as Achievement[]);
      setVisitedPlaces(visitedData as VisitedPlace[]);
      setIsOfflineData(!isOnline);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validVisitedPlaces = visitedPlaces.filter(
    (v) =>
      v.place &&
      typeof v.place.latitude === "number" &&
      typeof v.place.longitude === "number" &&
      !isNaN(v.place.latitude) &&
      !isNaN(v.place.longitude)
  );

  useEffect(() => {
    if (validVisitedPlaces.length > 0 && mapRef.current) {
      const coordinates = validVisitedPlaces.map((v) => ({
        latitude: v.place.latitude,
        longitude: v.place.longitude,
      }));
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [validVisitedPlaces]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleCheckAchievements = async () => {
    if (!isOnline) {
      Alert.alert(
        "Offline",
        "You need to be online to check for new achievements. Please connect to the internet and try again."
      );
      return;
    }

    setIsChecking(true);
    try {
      const newAchievements = await checkAchievements();
      if (newAchievements.length > 0) {
        setAchievements((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const uniqueNew = newAchievements.filter((a: Achievement) => !existingIds.has(a.id));
          return [...uniqueNew, ...prev];
        });
      }
    } catch (error) {
      console.error("Check achievements error:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const uniqueCountries = [...new Set(validVisitedPlaces.map((p) => p.place.country))];
  const uniqueCities = [...new Set(validVisitedPlaces.map((p) => p.place.city))];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAchievementStyle = (type: string) => {
    return ACHIEVEMENT_ICONS[type] || ACHIEVEMENT_ICONS.default;
  };

  const renderWorldMap = () => {
    if (validVisitedPlaces.length === 0) {
      return (
        <View style={[styles.mapFallback, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={[styles.emptyMapIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="map" size={40} color={theme.primary} />
          </View>
          <ThemedText type="h4" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
            Your Travel Map
          </ThemedText>
          <ThemedText type="body" style={{ marginTop: Spacing.sm, color: theme.textSecondary, textAlign: "center" }}>
            Start exploring to see your visited places on the map
          </ThemedText>
        </View>
      );
    }

    if (Platform.OS === "web") {
      return (
        <View style={[styles.mapFallback, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="globe" size={48} color={theme.primary} />
          <ThemedText type="h4" style={{ marginTop: Spacing.md, textAlign: "center" }}>
            {validVisitedPlaces.length} Places Visited
          </ThemedText>
          <ThemedText type="body" style={{ marginTop: Spacing.sm, color: theme.textSecondary, textAlign: "center" }}>
            Across {uniqueCountries.length} {uniqueCountries.length === 1 ? "country" : "countries"}
          </ThemedText>
          <View style={styles.countryBadges}>
            {uniqueCountries.slice(0, 6).map((country) => (
              <View key={country} style={[styles.countryBadge, { backgroundColor: theme.primary + "20" }]}>
                <ThemedText type="caption" style={{ color: theme.primary }}>
                  {country}
                </ThemedText>
              </View>
            ))}
            {uniqueCountries.length > 6 ? (
              <View style={[styles.countryBadge, { backgroundColor: theme.textSecondary + "20" }]}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  +{uniqueCountries.length - 6} more
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText type="small" style={{ marginTop: Spacing.md, color: theme.textSecondary, textAlign: "center" }}>
            Use Expo Go for interactive map view
          </ThemedText>
        </View>
      );
    }

    const MapComponent = Platform.OS === "ios" ? AppleMapsView : GoogleMapsView;
    
    if (!MapComponent) {
      return (
        <View style={[styles.mapFallback, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="globe" size={48} color={theme.primary} />
          <ThemedText type="h4" style={{ marginTop: Spacing.md, textAlign: "center" }}>
            Map not available
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <MapComponent
          ref={mapRef}
          style={styles.map}
          cameraPosition={{
            coordinates: {
              latitude: 20,
              longitude: 0,
            },
            zoom: 1,
          }}
          markers={validVisitedPlaces.map((visited) => ({
            id: visited.id,
            coordinates: {
              latitude: visited.place.latitude,
              longitude: visited.place.longitude,
            },
            title: visited.place.name,
          }))}
          uiSettings={{
            compassEnabled: false,
            rotateGesturesEnabled: false,
            tiltGesturesEnabled: false,
          }}
        />
        <View style={[styles.mapOverlay, { backgroundColor: theme.overlay }]}>
          <View style={styles.mapStats}>
            <View style={styles.mapStatItem}>
              <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
                {validVisitedPlaces.length}
              </ThemedText>
              <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
                Places
              </ThemedText>
            </View>
            <View style={[styles.mapStatDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
            <View style={styles.mapStatItem}>
              <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
                {uniqueCountries.length}
              </ThemedText>
              <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
                Countries
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderStatsCard = () => (
    <Card elevation={1} style={styles.statsCard}>
      <ThemedText type="h3" style={styles.statsTitle}>
        Travel Stats
      </ThemedText>
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="map-pin" size={24} color={theme.primary} />
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {validVisitedPlaces.length}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Places Visited
          </ThemedText>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.secondary + "20" }]}>
          <Feather name="map" size={24} color={theme.secondary} />
          <ThemedText type="h2" style={{ color: theme.secondary }}>
            {uniqueCities.length}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Cities Explored
          </ThemedText>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.accent + "20" }]}>
          <Feather name="globe" size={24} color={theme.accent} />
          <ThemedText type="h2" style={{ color: theme.accent }}>
            {uniqueCountries.length}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Countries
          </ThemedText>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.success + "20" }]}>
          <Feather name="award" size={24} color={theme.success} />
          <ThemedText type="h2" style={{ color: theme.success }}>
            {achievements.length}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Achievements
          </ThemedText>
        </View>
      </View>
    </Card>
  );

  const renderAchievementCard = ({ item }: { item: Achievement }) => {
    const style = getAchievementStyle(item.type);
    return (
      <Card elevation={1} style={styles.achievementCard}>
        <View
          style={[
            styles.badgeContainer,
            { backgroundColor: style.color + "20" },
          ]}
        >
          <Feather name={style.icon as any} size={28} color={style.color} />
        </View>
        <View style={styles.achievementInfo}>
          <ThemedText type="h4" numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText
            type="caption"
            style={{ color: theme.textSecondary }}
            numberOfLines={2}
          >
            {item.description}
          </ThemedText>
          <View style={styles.unlockedRow}>
            <Feather name="unlock" size={12} color={theme.success} />
            <ThemedText
              type="small"
              style={{ color: theme.success, marginLeft: 4 }}
            >
              {formatDate(item.unlockedAt)}
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        renderItem={renderAchievementCard}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <View style={styles.headerTitle}>
                  <ThemedText type="h2">Achievements</ThemedText>
                  {isOfflineData ? <OfflineBadge /> : null}
                </View>
                <ThemedText
                  type="body"
                  style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                >
                  Your travel milestones
                </ThemedText>
              </View>
              <Pressable
                style={[
                  styles.checkButton,
                  { backgroundColor: theme.primary, opacity: isChecking || !isOnline ? 0.5 : 1 },
                ]}
                onPress={handleCheckAchievements}
                disabled={isChecking || !isOnline}
              >
                {isChecking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="refresh-cw" size={18} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            {renderWorldMap()}
            {renderStatsCard()}

            <ThemedText type="h3" style={styles.sectionTitle}>
              Unlocked Badges ({achievements.length})
            </ThemedText>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <Feather name="award" size={48} color={theme.textSecondary} />
            </View>
            <ThemedText type="h3" style={styles.emptyTitle}>
              No Achievements Yet
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Start exploring to unlock badges
            </ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  mapStats: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  mapStatItem: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  mapStatDivider: {
    width: 1,
    height: 40,
  },
  mapFallback: {
    height: MAP_HEIGHT,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  statsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statsTitle: {
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statItem: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.lg * 2 - Spacing.sm) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  achievementCard: {
    flexDirection: "row",
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  badgeContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  unlockedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
  emptyMapIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  countryBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  countryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});
