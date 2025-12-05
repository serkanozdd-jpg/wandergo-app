import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getPlaces, createRoute } from "@/lib/api";

type Place = {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
};

const ROUTE_TYPES = [
  { id: "walking", name: "Walking", icon: "navigation" },
  { id: "running", name: "Running", icon: "activity" },
  { id: "driving", name: "Driving", icon: "truck" },
  { id: "transit", name: "Transit", icon: "navigation-2" },
];

export default function CreateRouteScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, "CreateRoute">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const initialPlaceIds = route.params?.selectedPlaceIds || [];

  const [name, setName] = useState("");
  const [routeType, setRouteType] = useState("walking");
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>(initialPlaceIds);
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPlaceSelector, setShowPlaceSelector] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const data = await getPlaces({ limit: 50 });
        setAvailablePlaces(data);
      } catch (error) {
        console.error("Fetch places error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter a route name");
      return;
    }

    if (selectedPlaceIds.length < 2) {
      Alert.alert("Add Places", "Please add at least 2 places to your route");
      return;
    }

    setIsSubmitting(true);

    try {
      await createRoute({
        name: name.trim(),
        routeType,
        placeIds: selectedPlaceIds,
      });
      Alert.alert("Success", "Your route has been created!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create route. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlace = (placeId: string) => {
    setSelectedPlaceIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  };

  const removePlace = (placeId: string) => {
    setSelectedPlaceIds((prev) => prev.filter((id) => id !== placeId));
  };

  const selectedPlaces = availablePlaces.filter((p) =>
    selectedPlaceIds.includes(p.id)
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()}>
          <ThemedText type="body">Cancel</ThemedText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={handleSubmit}
          disabled={!name.trim() || selectedPlaceIds.length < 2 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <ThemedText
              type="body"
              style={{
                color:
                  !name.trim() || selectedPlaceIds.length < 2
                    ? theme.textSecondary
                    : theme.primary,
                fontWeight: "600",
              }}
            >
              Create
            </ThemedText>
          )}
        </Pressable>
      ),
    });
  }, [navigation, name, selectedPlaceIds, isSubmitting, theme, handleSubmit]);

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Route Name
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="My Awesome Route"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Transport Mode
          </ThemedText>
          <View style={styles.routeTypes}>
            {ROUTE_TYPES.map((type) => (
              <Pressable
                key={type.id}
                style={({ pressed }) => [
                  styles.routeTypeButton,
                  {
                    backgroundColor:
                      routeType === type.id
                        ? theme.primary
                        : theme.backgroundDefault,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={() => setRouteType(type.id)}
              >
                <Feather
                  name={type.icon as any}
                  size={20}
                  color={routeType === type.id ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: routeType === type.id ? "#FFFFFF" : theme.text,
                    marginTop: Spacing.xs,
                  }}
                >
                  {type.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Places ({selectedPlaceIds.length})</ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => setShowPlaceSelector(!showPlaceSelector)}
            >
              <Feather
                name={showPlaceSelector ? "x" : "plus"}
                size={18}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {selectedPlaces.length > 0 ? (
            <View style={styles.selectedPlaces}>
              {selectedPlaces.map((place, index) => (
                <Card key={place.id} elevation={1} style={styles.placeItem}>
                  <View style={styles.placeNumber}>
                    <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  <View style={styles.placeInfo}>
                    <ThemedText type="body" numberOfLines={1}>
                      {place.name}
                    </ThemedText>
                    <ThemedText
                      type="caption"
                      style={{ color: theme.textSecondary }}
                    >
                      {place.city}, {place.country}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => removePlace(place.id)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                  >
                    <Feather name="x" size={18} color={theme.error} />
                  </Pressable>
                </Card>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyPlaces,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <Feather name="map-pin" size={24} color={theme.textSecondary} />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                Add at least 2 places
              </ThemedText>
            </View>
          )}

          {showPlaceSelector ? (
            <View style={styles.placeSelector}>
              <ThemedText
                type="small"
                style={[styles.selectorTitle, { color: theme.textSecondary }]}
              >
                Tap to add places:
              </ThemedText>
              <FlatList
                data={availablePlaces.filter(
                  (p) => !selectedPlaceIds.includes(p.id)
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.selectorItem,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => togglePlace(item.id)}
                  >
                    <ThemedText type="small" numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                  </Pressable>
                )}
              />
            </View>
          ) : null}
        </View>
      </KeyboardAwareScrollViewCompat>
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
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  routeTypes: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  routeTypeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedPlaces: {
    gap: Spacing.sm,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  placeNumber: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: "#00B4A0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  placeInfo: {
    flex: 1,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  emptyPlaces: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    borderRadius: BorderRadius.md,
  },
  emptyText: {
    marginTop: Spacing.sm,
  },
  placeSelector: {
    marginTop: Spacing.lg,
  },
  selectorTitle: {
    marginBottom: Spacing.sm,
  },
  selectorItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
});
