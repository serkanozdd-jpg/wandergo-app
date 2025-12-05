import React from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { StarRating } from "@/components/StarRating";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface Place {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  city: string;
  country: string;
  imageUrl?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
}

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  variant?: "horizontal" | "vertical";
}

const HORIZONTAL_WIDTH = 200;
const HORIZONTAL_HEIGHT = 160;

export function PlaceCard({ place, onPress, variant = "vertical" }: PlaceCardProps) {
  const { theme } = useTheme();

  if (variant === "horizontal") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.horizontalCard,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={[styles.horizontalImageContainer, { backgroundColor: theme.backgroundDefault }]}>
          {place.imageUrl ? (
            <Image
              source={{ uri: place.imageUrl }}
              style={styles.horizontalImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="image" size={24} color={theme.textSecondary} />
            </View>
          )}
          <View style={styles.horizontalOverlay} />
          <View style={styles.horizontalContent}>
            <ThemedText
              type="h4"
              style={styles.horizontalTitle}
              numberOfLines={1}
            >
              {place.name}
            </ThemedText>
            <View style={styles.horizontalLocation}>
              <Feather name="map-pin" size={12} color="#FFFFFF" />
              <ThemedText type="caption" style={styles.horizontalLocationText}>
                {place.city}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Card elevation={1} onPress={onPress}>
      <View style={styles.verticalCard}>
        <View style={[styles.verticalImageContainer, { backgroundColor: theme.backgroundSecondary }]}>
          {place.imageUrl ? (
            <Image
              source={{ uri: place.imageUrl }}
              style={styles.verticalImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="image" size={32} color={theme.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.verticalContent}>
          <ThemedText type="h4" numberOfLines={1}>
            {place.name}
          </ThemedText>
          <View style={styles.verticalLocation}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[styles.locationText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {place.city}, {place.country}
            </ThemedText>
          </View>
          {place.description ? (
            <ThemedText
              type="small"
              style={[styles.description, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {place.description}
            </ThemedText>
          ) : null}
          <View style={styles.footer}>
            {place.avgRating ? (
              <View style={styles.rating}>
                <StarRating rating={place.avgRating} size={14} />
                <ThemedText type="small" style={styles.ratingText}>
                  {place.avgRating.toFixed(1)}
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{ color: theme.textSecondary }}
                >
                  ({place.reviewCount || 0})
                </ThemedText>
              </View>
            ) : (
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary }}
              >
                No reviews yet
              </ThemedText>
            )}
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <ThemedText
                type="caption"
                style={{ color: theme.primary, textTransform: "capitalize" }}
              >
                {place.category}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  horizontalCard: {
    width: HORIZONTAL_WIDTH,
  },
  horizontalImageContainer: {
    width: HORIZONTAL_WIDTH,
    height: HORIZONTAL_HEIGHT,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  horizontalImage: {
    width: "100%",
    height: "100%",
  },
  horizontalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  horizontalContent: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
  },
  horizontalTitle: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  horizontalLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  horizontalLocationText: {
    color: "#FFFFFF",
    marginLeft: 4,
    opacity: 0.9,
  },
  verticalCard: {
    flexDirection: "row",
  },
  verticalImageContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  verticalImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  verticalContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  verticalLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  locationText: {
    marginLeft: 4,
    flex: 1,
  },
  description: {
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  ratingText: {
    fontWeight: "600",
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
