import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PlaceCard } from "@/components/PlaceCard";
import { OfflineBadge } from "@/components/OfflineIndicator";
import { useTheme } from "@/hooks/useTheme";
import { useOffline } from "@/hooks/useOffline";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getPlacesWithOffline } from "@/lib/offline-api";

type Place = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  imageUrl?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { isOnline } = useOffline();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(status === "granted");
        
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }

        const data = await getPlacesWithOffline({ limit: 50 });
        setPlaces(data);
        setIsOfflineData(!isOnline);
      } catch (error) {
        console.error("Init error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [isOnline]);

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };

  const handlePlaceDetails = () => {
    if (selectedPlace) {
      navigation.navigate("PlaceDetail", { placeId: selectedPlace.id });
    }
  };

  const handleCreateRoute = () => {
    navigation.navigate("CreateRoute", {});
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
      <View style={[styles.mapPlaceholder, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.mapContent}>
          <Feather name="map" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={styles.mapTitle}>
            Explore Map
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.mapSubtitle, { color: theme.textSecondary }]}
          >
            {Platform.OS === "web"
              ? "Map view is optimized for mobile. Use Expo Go to explore the full map experience."
              : "Interactive map coming soon"}
          </ThemedText>
          
          {location ? (
            <View style={styles.locationInfo}>
              <Feather name="navigation" size={16} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.primary, marginLeft: Spacing.xs }}>
                Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.placesHeader}>
            <ThemedText type="h4" style={styles.placesTitle}>
              {places.length} Places Available
            </ThemedText>
            {isOfflineData ? <OfflineBadge /> : null}
          </View>

          <View style={styles.placesList}>
            {places.slice(0, 5).map((place) => (
              <Pressable
                key={place.id}
                style={({ pressed }) => [
                  styles.placeItem,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    opacity: pressed ? 0.8 : 1,
                    borderColor: selectedPlace?.id === place.id ? theme.primary : "transparent",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => handlePlaceSelect(place)}
              >
                <Feather name="map-pin" size={16} color={theme.primary} />
                <View style={styles.placeItemInfo}>
                  <ThemedText type="small" numberOfLines={1}>
                    {place.name}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    {place.city}, {place.country}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {selectedPlace ? (
        <View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.tabBarHeight + Spacing.lg,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <PlaceCard
            place={selectedPlace}
            onPress={handlePlaceDetails}
            variant="horizontal"
          />
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.secondary,
            bottom: insets.bottom + Spacing.tabBarHeight + Spacing.xl,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={handleCreateRoute}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContent: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  mapTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  mapSubtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  placesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  placesTitle: {
  },
  placesList: {
    width: "100%",
    gap: Spacing.sm,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  placeItemInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: Spacing.fabSize,
    height: Spacing.fabSize,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
