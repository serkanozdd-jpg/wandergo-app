import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getPlace, getPlaceReviews, addFavorite, removeFavorite, generateArticle } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 280;

type Place = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address?: string | null;
  imageUrl?: string | null;
  entryFee?: string | null;
  visitDuration?: string | null;
  bestTime?: string | null;
  aiArticle?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
  isFavorite?: boolean;
};

type Review = {
  id: string;
  userId: string;
  placeId: string;
  rating: number;
  content?: string | null;
  photos?: string[] | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarPreset?: number | null;
  };
};

export default function PlaceDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, "PlaceDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  const { placeId } = route.params;

  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [showFullArticle, setShowFullArticle] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [placeData, reviewsData] = await Promise.all([
        getPlace(placeId),
        getPlaceReviews(placeId),
      ]);
      setPlace(placeData);
      setIsFavorite(placeData.isFavorite || false);
      setReviews(reviewsData);
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to load place details");
    } finally {
      setIsLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to save favorites");
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(placeId);
      } else {
        await addFavorite(placeId);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      Alert.alert("Error", "Failed to update favorite");
    }
  };

  const handleGenerateArticle = async () => {
    setIsGeneratingArticle(true);
    try {
      const result = await generateArticle(placeId);
      setPlace((prev) => prev ? { ...prev, aiArticle: result.article } : null);
    } catch (error) {
      Alert.alert("Error", "Failed to generate article");
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to write a review");
      return;
    }
    navigation.navigate("CreateReview", { placeId, placeName: place?.name || "" });
  };

  const handleCreateRoute = () => {
    navigation.navigate("CreateRoute", { selectedPlaceIds: [placeId] });
  };

  if (isLoading || !place) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          {place.imageUrl ? (
            <Image
              source={{ uri: place.imageUrl }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="image" size={48} color={theme.textSecondary} />
            </View>
          )}
          <View
            style={[styles.imageOverlay, { paddingTop: insets.top + Spacing.xl }]}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ThemedText type="h1" style={styles.title}>
                {place.name}
              </ThemedText>
              <Pressable
                onPress={handleToggleFavorite}
                style={({ pressed }) => [
                  styles.favoriteButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather
                  name={isFavorite ? "heart" : "heart"}
                  size={24}
                  color={isFavorite ? theme.error : theme.textSecondary}
                  style={{ opacity: isFavorite ? 1 : 0.5 }}
                />
              </Pressable>
            </View>

            <View style={styles.locationRow}>
              <Feather name="map-pin" size={16} color={theme.textSecondary} />
              <ThemedText
                type="body"
                style={[styles.location, { color: theme.textSecondary }]}
              >
                {place.city}, {place.country}
              </ThemedText>
            </View>

            {place.avgRating ? (
              <View style={styles.ratingRow}>
                <StarRating rating={place.avgRating} size={20} />
                <ThemedText type="body" style={styles.ratingText}>
                  {place.avgRating.toFixed(1)}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary }}
                >
                  ({place.reviewCount || 0} reviews)
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleCreateRoute}
            >
              <Feather name="navigation" size={18} color="#FFFFFF" />
              <ThemedText
                type="small"
                style={[styles.actionText, { color: "#FFFFFF" }]}
              >
                Directions
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleToggleFavorite}
            >
              <Feather
                name="bookmark"
                size={18}
                color={isFavorite ? theme.primary : theme.text}
              />
              <ThemedText type="small" style={styles.actionText}>
                Save
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleWriteReview}
            >
              <Feather name="edit-3" size={18} color={theme.text} />
              <ThemedText type="small" style={styles.actionText}>
                Review
              </ThemedText>
            </Pressable>
          </View>

          {place.description ? (
            <Card elevation={1} style={styles.card}>
              <ThemedText type="h4" style={styles.cardTitle}>
                About
              </ThemedText>
              <ThemedText type="body">{place.description}</ThemedText>
            </Card>
          ) : null}

          <Card elevation={1} style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText type="h4" style={styles.cardTitle}>
                AI Travel Guide
              </ThemedText>
              <View
                style={[styles.aiBadge, { backgroundColor: theme.accent + "20" }]}
              >
                <Feather name="cpu" size={12} color={theme.accent} />
                <ThemedText
                  type="caption"
                  style={{ color: theme.accent, marginLeft: 4 }}
                >
                  AI
                </ThemedText>
              </View>
            </View>
            
            {place.aiArticle ? (
              <>
                <ThemedText
                  type="body"
                  numberOfLines={showFullArticle ? undefined : 5}
                >
                  {place.aiArticle}
                </ThemedText>
                <Pressable
                  onPress={() => setShowFullArticle(!showFullArticle)}
                  style={styles.readMoreButton}
                >
                  <ThemedText type="link">
                    {showFullArticle ? "Show less" : "Read more"}
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.generateButton,
                  { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleGenerateArticle}
                disabled={isGeneratingArticle}
              >
                {isGeneratingArticle ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="zap" size={18} color="#FFFFFF" />
                    <ThemedText
                      type="body"
                      style={{ color: "#FFFFFF", marginLeft: Spacing.sm }}
                    >
                      Generate Travel Guide
                    </ThemedText>
                  </>
                )}
              </Pressable>
            )}
          </Card>

          <Card elevation={1} style={styles.card}>
            <ThemedText type="h4" style={styles.cardTitle}>
              Visit Info
            </ThemedText>
            <View style={styles.infoGrid}>
              {place.entryFee ? (
                <View style={styles.infoItem}>
                  <Feather name="dollar-sign" size={18} color={theme.primary} />
                  <View style={styles.infoContent}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Entry Fee
                    </ThemedText>
                    <ThemedText type="body">{place.entryFee}</ThemedText>
                  </View>
                </View>
              ) : null}
              {place.visitDuration ? (
                <View style={styles.infoItem}>
                  <Feather name="clock" size={18} color={theme.primary} />
                  <View style={styles.infoContent}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Duration
                    </ThemedText>
                    <ThemedText type="body">{place.visitDuration}</ThemedText>
                  </View>
                </View>
              ) : null}
              {place.bestTime ? (
                <View style={styles.infoItem}>
                  <Feather name="sun" size={18} color={theme.primary} />
                  <View style={styles.infoContent}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Best Time
                    </ThemedText>
                    <ThemedText type="body">{place.bestTime}</ThemedText>
                  </View>
                </View>
              ) : null}
            </View>
          </Card>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <ThemedText type="h3">Reviews</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {reviews.length} reviews
              </ThemedText>
            </View>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewContainer}>
                  <ReviewCard review={review} />
                </View>
              ))
            ) : (
              <View style={styles.noReviews}>
                <Feather name="message-circle" size={32} color={theme.textSecondary} />
                <ThemedText
                  type="body"
                  style={[styles.noReviewsText, { color: theme.textSecondary }]}
                >
                  No reviews yet. Be the first!
                </ThemedText>
                <Pressable
                  style={({ pressed }) => [
                    styles.writeReviewButton,
                    { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={handleWriteReview}
                >
                  <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                    Write a Review
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  content: {
    marginTop: -Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    backgroundColor: "transparent",
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  favoriteButton: {
    padding: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  location: {
    marginLeft: Spacing.xs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  ratingText: {
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionText: {
    fontWeight: "600",
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  readMoreButton: {
    marginTop: Spacing.sm,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoGrid: {
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: Spacing.md,
  },
  reviewsSection: {
    marginTop: Spacing.lg,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  reviewContainer: {
    marginBottom: Spacing.md,
  },
  noReviews: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  noReviewsText: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  writeReviewButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
