import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { OfflineBadge } from "@/components/OfflineIndicator";
import { useTheme } from "@/hooks/useTheme";
import { useOffline } from "@/hooks/useOffline";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getRoutesWithOffline } from "@/lib/offline-api";
import { deleteRoute } from "@/lib/api";

type Route = {
  id: string;
  name: string;
  description?: string | null;
  routeType: string;
  placeIds: string[];
  estimatedDuration?: number | null;
  estimatedDistance?: number | null;
  createdAt: string;
};

const ROUTE_TYPE_ICONS: Record<string, string> = {
  walking: "navigation",
  running: "activity",
  driving: "truck",
  transit: "navigation-2",
};

const ROUTE_TYPE_LABELS: Record<string, string> = {
  walking: "Walking",
  running: "Running",
  driving: "Driving",
  transit: "Transit",
};

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { isOnline } = useOffline();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  const fetchRoutes = useCallback(async () => {
    try {
      const data = await getRoutesWithOffline();
      setRoutes(data as Route[]);
      setIsOfflineData(!isOnline);
    } catch (error) {
      console.error("Fetch routes error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRoutes();
  };

  const handleDeleteRoute = (routeId: string) => {
    if (!isOnline) {
      Alert.alert(
        "Offline",
        "You need to be online to delete routes. Please connect to the internet and try again."
      );
      return;
    }

    Alert.alert(
      "Delete Route",
      "Are you sure you want to delete this route?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoute(routeId);
              setRoutes((prev) => prev.filter((r) => r.id !== routeId));
            } catch (error) {
              Alert.alert("Error", "Failed to delete route");
            }
          },
        },
      ]
    );
  };

  const handleCreateRoute = () => {
    navigation.navigate("CreateRoute", {});
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDistance = (km?: number | null) => {
    if (!km) return null;
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)} km`;
  };

  const renderRouteCard = ({ item }: { item: Route }) => (
    <Card
      elevation={1}
      style={styles.routeCard}
      onPress={() => {}}
    >
      <View style={styles.routeHeader}>
        <View
          style={[
            styles.routeIcon,
            { backgroundColor: theme.primary + "20" },
          ]}
        >
          <Feather
            name={(ROUTE_TYPE_ICONS[item.routeType] || "map") as any}
            size={24}
            color={theme.primary}
          />
        </View>
        <View style={styles.routeInfo}>
          <ThemedText type="h4" numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
          >
            {ROUTE_TYPE_LABELS[item.routeType] || item.routeType} Route
          </ThemedText>
        </View>
        <Pressable
          onPress={() => handleDeleteRoute(item.id)}
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Feather name="trash-2" size={18} color={theme.error} />
        </Pressable>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.routeStat}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <ThemedText
            type="small"
            style={[styles.routeStatText, { color: theme.textSecondary }]}
          >
            {item.placeIds.length} stops
          </ThemedText>
        </View>

        {item.estimatedDuration ? (
          <View style={styles.routeStat}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[styles.routeStatText, { color: theme.textSecondary }]}
            >
              {formatDuration(item.estimatedDuration)}
            </ThemedText>
          </View>
        ) : null}

        {item.estimatedDistance ? (
          <View style={styles.routeStat}>
            <Feather name="navigation" size={14} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[styles.routeStatText, { color: theme.textSecondary }]}
            >
              {formatDistance(item.estimatedDistance)}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Card>
  );

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
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderRouteCard}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <ThemedText type="h2">My Routes</ThemedText>
                {isOfflineData ? <OfflineBadge /> : null}
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleCreateRoute}
                disabled={!isOnline}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.aiPlannerCard,
                { backgroundColor: theme.accent, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => navigation.navigate("ItineraryPlanner")}
            >
              <View style={styles.aiPlannerContent}>
                <Feather name="sparkles" size={24} color="#FFFFFF" />
                <View style={styles.aiPlannerText}>
                  <ThemedText type="label" style={{ color: "#FFFFFF" }}>
                    AI Trip Planner
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
                    Generate personalized daily itineraries
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={24} color="#FFFFFF" />
            </Pressable>
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <Feather name="map" size={48} color={theme.textSecondary} />
            </View>
            <ThemedText type="h3" style={styles.emptyTitle}>
              No Routes Yet
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Create your first route to start exploring
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleCreateRoute}
            >
              <ThemedText type="body" style={styles.createButtonText}>
                Create Route
              </ThemedText>
            </Pressable>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  aiPlannerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  aiPlannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiPlannerText: {
    marginLeft: Spacing.md,
  },
  routeCard: {
    padding: Spacing.lg,
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  routeInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  routeDetails: {
    flexDirection: "row",
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  routeStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeStatText: {
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  createButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
