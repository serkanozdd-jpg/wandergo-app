import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PlaceCard } from "@/components/PlaceCard";
import { CategoryChip } from "@/components/CategoryChip";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getPlaces, getNearbyPlaces, getPopularPlaces } from "@/lib/api";

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

const CATEGORIES = [
  { id: "all", name: "All", icon: "grid" },
  { id: "museum", name: "Museums", icon: "book-open" },
  { id: "park", name: "Parks", icon: "sun" },
  { id: "restaurant", name: "Food", icon: "coffee" },
  { id: "historical", name: "Historical", icon: "clock" },
  { id: "beach", name: "Beaches", icon: "umbrella" },
  { id: "nightlife", name: "Nightlife", icon: "moon" },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<Place[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");
      
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        return { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }
    } catch (error) {
      console.error("Location error:", error);
    }
    return null;
  };

  const fetchData = useCallback(async (coords?: { lat: number; lng: number } | null) => {
    try {
      const [popularData, allData] = await Promise.all([
        getPopularPlaces(10),
        getPlaces({ limit: 50 }),
      ]);
      
      setPopularPlaces(popularData);
      setAllPlaces(allData);

      if (coords) {
        const nearbyData = await getNearbyPlaces(coords.lat, coords.lng, 20, 10);
        setNearbyPlaces(nearbyData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const coords = await fetchLocation();
      await fetchData(coords);
    };
    init();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const coords = location || (await fetchLocation());
    await fetchData(coords);
  };

  const filteredPlaces = allPlaces.filter((place) => {
    const matchesCategory = selectedCategory === "all" || place.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePlacePress = (place: Place) => {
    navigation.navigate("PlaceDetail", { placeId: place.id });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <HeaderTitle title="WanderGo" />
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        ]}
      >
        <Feather name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search places..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <CategoryChip
            name={item.name}
            icon={item.icon as any}
            isSelected={selectedCategory === item.id}
            onPress={() => setSelectedCategory(item.id)}
          />
        )}
      />

      {nearbyPlaces.length > 0 && !searchQuery && selectedCategory === "all" ? (
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Near You
          </ThemedText>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={nearbyPlaces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <PlaceCard
                place={item}
                onPress={() => handlePlacePress(item)}
                variant="horizontal"
              />
            )}
          />
        </View>
      ) : null}

      {popularPlaces.length > 0 && !searchQuery && selectedCategory === "all" ? (
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Popular This Week
          </ThemedText>
        </View>
      ) : (
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {searchQuery ? "Search Results" : "All Places"}
          </ThemedText>
        </View>
      )}
    </View>
  );

  const displayPlaces =
    !searchQuery && selectedCategory === "all" && popularPlaces.length > 0
      ? popularPlaces
      : filteredPlaces;

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
        data={displayPlaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.placeCardContainer}>
            <PlaceCard
              place={item}
              onPress={() => handlePlacePress(item)}
              variant="vertical"
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="map-pin" size={48} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              No places found
            </ThemedText>
          </View>
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
  headerContainer: {
    marginBottom: Spacing.lg,
  },
  titleRow: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  horizontalList: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  placeCardContainer: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
  },
});
