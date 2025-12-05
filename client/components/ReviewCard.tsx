import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { StarRating } from "@/components/StarRating";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface User {
  id: string;
  username: string;
  displayName?: string | null;
  avatarPreset?: number | null;
}

interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  imageUrl?: string | null;
}

interface Review {
  id: string;
  rating: number;
  content?: string | null;
  photos?: string[] | null;
  createdAt: string;
  user: User;
  place?: Place;
}

interface ReviewCardProps {
  review: Review;
  showPlace?: boolean;
  onPlacePress?: () => void;
}

export function ReviewCard({ review, showPlace = false, onPlacePress }: ReviewCardProps) {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card elevation={1}>
      {showPlace && review.place ? (
        <Pressable
          onPress={onPlacePress}
          style={({ pressed }) => [
            styles.placeSection,
            { borderBottomColor: theme.border, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View
            style={[
              styles.placeImage,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            {review.place.imageUrl ? (
              <Image
                source={{ uri: review.place.imageUrl }}
                style={styles.placeImageContent}
                contentFit="cover"
              />
            ) : (
              <Feather name="image" size={18} color={theme.textSecondary} />
            )}
          </View>
          <View style={styles.placeInfo}>
            <ThemedText type="h4" numberOfLines={1}>
              {review.place.name}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary }}
            >
              {review.place.city}, {review.place.country}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      ) : null}

      <View style={styles.reviewContent}>
        <View style={styles.header}>
          <Avatar preset={review.user.avatarPreset || 0} size={40} />
          <View style={styles.userInfo}>
            <ThemedText type="body" style={styles.userName}>
              {review.user.displayName || review.user.username}
            </ThemedText>
            <View style={styles.ratingRow}>
              <StarRating rating={review.rating} size={14} />
              <ThemedText
                type="caption"
                style={[styles.date, { color: theme.textSecondary }]}
              >
                {formatDate(review.createdAt)}
              </ThemedText>
            </View>
          </View>
        </View>

        {review.content ? (
          <ThemedText type="body" style={styles.content}>
            {review.content}
          </ThemedText>
        ) : null}

        {review.photos && review.photos.length > 0 ? (
          <View style={styles.photos}>
            {review.photos.slice(0, 3).map((photo, index) => (
              <View
                key={index}
                style={[
                  styles.photoContainer,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                  contentFit="cover"
                />
              </View>
            ))}
            {review.photos.length > 3 ? (
              <View
                style={[
                  styles.morePhotos,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  +{review.photos.length - 3}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  placeSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  placeImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  placeImageContent: {
    width: "100%",
    height: "100%",
  },
  placeInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  reviewContent: {},
  header: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  userName: {
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  date: {
    marginLeft: Spacing.sm,
  },
  content: {
    marginBottom: Spacing.md,
  },
  photos: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  morePhotos: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});
