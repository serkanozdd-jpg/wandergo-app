import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getItineraries, createItinerary, deleteItinerary, getPlaces } from "@/lib/api";

type Place = {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  imageUrl?: string | null;
  visitDuration?: string | null;
};

type Itinerary = {
  id: string;
  title: string;
  date: string;
  city?: string | null;
  country?: string | null;
  placeIds: string[];
  routeType: string;
  availableHours: number;
  generatedSchedule?: string | null;
  isCompleted: boolean;
  createdAt: string;
};

const ROUTE_TYPES = [
  { id: "walking", label: "Walking", icon: "activity" },
  { id: "running", label: "Running", icon: "zap" },
  { id: "transit", label: "Transit", icon: "navigation" },
  { id: "driving", label: "Driving", icon: "truck" },
];

const HOURS_OPTIONS = [4, 6, 8, 10, 12];

export default function ItineraryPlannerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [routeType, setRouteType] = useState("walking");
  const [availableHours, setAvailableHours] = useState(8);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    try {
      const [itinerariesData, placesData] = await Promise.all([
        getItineraries(),
        getPlaces({ limit: 50 }),
      ]);
      setItineraries(itinerariesData);
      setPlaces(placesData);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const togglePlaceSelection = (placeId: string) => {
    setSelectedPlaces((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleCreateItinerary = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your itinerary");
      return;
    }
    if (selectedPlaces.length === 0) {
      Alert.alert("Error", "Please select at least one place");
      return;
    }

    setIsCreating(true);
    try {
      const selectedPlaceDetails = places.filter((p) =>
        selectedPlaces.includes(p.id)
      );
      const city = selectedPlaceDetails[0]?.city;
      const country = selectedPlaceDetails[0]?.country;

      const itinerary = await createItinerary({
        title: title.trim(),
        date: selectedDate,
        city,
        country,
        placeIds: selectedPlaces,
        routeType,
        availableHours,
      });

      setItineraries((prev) => [itinerary, ...prev]);
      setShowCreateForm(false);
      resetForm();
      Alert.alert("Success", "Your AI-powered itinerary has been created!");
    } catch (error) {
      Alert.alert("Error", "Failed to create itinerary");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteItinerary = (id: string) => {
    Alert.alert(
      "Delete Itinerary",
      "Are you sure you want to delete this itinerary?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItinerary(id);
              setItineraries((prev) => prev.filter((i) => i.id !== id));
            } catch (error) {
              Alert.alert("Error", "Failed to delete itinerary");
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setTitle("");
    setSelectedPlaces([]);
    setRouteType("walking");
    setAvailableHours(8);
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const renderItineraryCard = ({ item }: { item: Itinerary }) => (
    <Card elevation={1} style={styles.itineraryCard}>
      <View style={styles.itineraryHeader}>
        <View style={styles.itineraryInfo}>
          <ThemedText type="h4" numberOfLines={1}>
            {item.title}
          </ThemedText>
          <View style={styles.itineraryMeta}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText
              type="caption"
              style={[styles.metaText, { color: theme.textSecondary }]}
            >
              {formatDate(item.date)}
            </ThemedText>
            {item.city ? (
              <>
                <Feather
                  name="map-pin"
                  size={14}
                  color={theme.textSecondary}
                  style={{ marginLeft: Spacing.sm }}
                />
                <ThemedText
                  type="caption"
                  style={[styles.metaText, { color: theme.textSecondary }]}
                >
                  {item.city}
                </ThemedText>
              </>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => handleDeleteItinerary(item.id)}
          hitSlop={8}
        >
          <Feather name="trash-2" size={20} color={theme.error} />
        </Pressable>
      </View>

      <View style={styles.itineraryStats}>
        <View style={[styles.statBadge, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="map" size={14} color={theme.primary} />
          <ThemedText type="caption" style={{ color: theme.primary, marginLeft: 4 }}>
            {item.placeIds?.length || 0} places
          </ThemedText>
        </View>
        <View style={[styles.statBadge, { backgroundColor: theme.secondary + "20" }]}>
          <Feather name="clock" size={14} color={theme.secondary} />
          <ThemedText type="caption" style={{ color: theme.secondary, marginLeft: 4 }}>
            {item.availableHours}h
          </ThemedText>
        </View>
        <View style={[styles.statBadge, { backgroundColor: theme.accent + "20" }]}>
          <Feather
            name={ROUTE_TYPES.find((r) => r.id === item.routeType)?.icon as any || "map"}
            size={14}
            color={theme.accent}
          />
          <ThemedText type="caption" style={{ color: theme.accent, marginLeft: 4 }}>
            {ROUTE_TYPES.find((r) => r.id === item.routeType)?.label || item.routeType}
          </ThemedText>
        </View>
      </View>

      {item.generatedSchedule ? (
        <View style={[styles.schedulePreview, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="caption" style={{ fontWeight: "600", marginBottom: Spacing.xs }}>
            AI Schedule
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.scheduleText, { color: theme.textSecondary }]}
            numberOfLines={4}
          >
            {item.generatedSchedule}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (showCreateForm) {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAwareScrollViewCompat
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
        >
          <View style={styles.formHeader}>
            <Pressable onPress={() => setShowCreateForm(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h2" style={{ flex: 1, marginLeft: Spacing.md }}>
              Plan Your Day
            </ThemedText>
          </View>

          <Card elevation={1} style={styles.formCard}>
            <ThemedText type="label" style={styles.formLabel}>
              Trip Title
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Paris Day Tour"
              placeholderTextColor={theme.textSecondary}
            />

            <ThemedText type="label" style={styles.formLabel}>
              Date
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
            />

            <ThemedText type="label" style={styles.formLabel}>
              Available Hours
            </ThemedText>
            <View style={styles.optionsRow}>
              {HOURS_OPTIONS.map((hours) => (
                <Pressable
                  key={hours}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor:
                        availableHours === hours ? theme.primary : theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setAvailableHours(hours)}
                >
                  <ThemedText
                    type="caption"
                    style={{ color: availableHours === hours ? "#FFFFFF" : theme.text }}
                  >
                    {hours}h
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="label" style={styles.formLabel}>
              Transport Mode
            </ThemedText>
            <View style={styles.optionsRow}>
              {ROUTE_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.optionChip,
                    styles.routeChip,
                    {
                      backgroundColor:
                        routeType === type.id ? theme.primary : theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setRouteType(type.id)}
                >
                  <Feather
                    name={type.icon as any}
                    size={16}
                    color={routeType === type.id ? "#FFFFFF" : theme.text}
                  />
                  <ThemedText
                    type="caption"
                    style={{
                      color: routeType === type.id ? "#FFFFFF" : theme.text,
                      marginLeft: 4,
                    }}
                  >
                    {type.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Card>

          <ThemedText type="h3" style={styles.sectionTitle}>
            Select Places ({selectedPlaces.length})
          </ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.placesScroll}
          >
            {places.map((place) => (
              <Pressable
                key={place.id}
                style={[
                  styles.placeChip,
                  {
                    backgroundColor: selectedPlaces.includes(place.id)
                      ? theme.primary
                      : theme.backgroundSecondary,
                    borderColor: selectedPlaces.includes(place.id)
                      ? theme.primary
                      : theme.border,
                  },
                ]}
                onPress={() => togglePlaceSelection(place.id)}
              >
                {selectedPlaces.includes(place.id) ? (
                  <Feather name="check" size={14} color="#FFFFFF" />
                ) : null}
                <ThemedText
                  type="caption"
                  style={{
                    color: selectedPlaces.includes(place.id) ? "#FFFFFF" : theme.text,
                    marginLeft: selectedPlaces.includes(place.id) ? 4 : 0,
                  }}
                  numberOfLines={1}
                >
                  {place.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[
              styles.createButton,
              {
                backgroundColor: theme.primary,
                opacity: isCreating ? 0.7 : 1,
              },
            ]}
            onPress={handleCreateItinerary}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather name="sparkles" size={20} color="#FFFFFF" />
                <ThemedText type="label" style={styles.createButtonText}>
                  Generate AI Itinerary
                </ThemedText>
              </>
            )}
          </Pressable>
        </KeyboardAwareScrollViewCompat>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={itineraries}
        keyExtractor={(item) => item.id}
        renderItem={renderItineraryCard}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h2">Trip Planner</ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              AI-powered daily itineraries
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={64} color={theme.textSecondary} />
            <ThemedText type="h3" style={styles.emptyTitle}>
              No Itineraries Yet
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Create your first AI-powered daily plan
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

      <Pressable
        style={[
          styles.fab,
          { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.tabBarHeight + Spacing.lg },
        ]}
        onPress={() => setShowCreateForm(true)}
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
  header: {
    marginBottom: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  itineraryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  itineraryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  itineraryInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itineraryMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  metaText: {
    marginLeft: 4,
  },
  itineraryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  schedulePreview: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  scheduleText: {
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  formLabel: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  routeChip: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  placesScroll: {
    marginBottom: Spacing.xl,
  },
  placeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
