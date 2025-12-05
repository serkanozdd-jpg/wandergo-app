import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { ReviewCard } from "@/components/ReviewCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getVisitedPlaces } from "@/lib/api";
import { authFetch } from "@/lib/api";

type Review = {
  id: string;
  placeId: string;
  rating: number;
  content?: string | null;
  photos?: string[] | null;
  createdAt: string;
  place: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();

  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch("/api/reviews/community?limit=5");
      if (res.ok) {
        const data = await res.json();
        const userReviews = data.filter((r: any) => r.userId === user?.id);
        setRecentReviews(userReviews.slice(0, 3));
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    await fetchData();
  };

  const handleSettings = () => {
    navigation.navigate("Settings");
  };

  const handlePlacePress = (placeId: string) => {
    navigation.navigate("PlaceDetail", { placeId });
  };

  if (!user) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
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
      >
        <View style={styles.header}>
          <ThemedText type="h2">Profile</ThemedText>
          <Pressable
            onPress={handleSettings}
            style={({ pressed }) => [
              styles.settingsButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Feather name="settings" size={24} color={theme.text} />
          </Pressable>
        </View>

        <Card elevation={1} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar preset={user.avatarPreset || 0} size={80} />
            <View style={styles.profileInfo}>
              <ThemedText type="h3">
                {user.displayName || user.username}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                @{user.username}
              </ThemedText>
              {user.bio ? (
                <ThemedText
                  type="small"
                  style={[styles.bio, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {user.bio}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <Card elevation={1} style={styles.statCard}>
            <View style={styles.statContent}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Feather name="map-pin" size={20} color={theme.primary} />
              </View>
              <ThemedText type="h2" style={styles.statNumber}>
                {user.placesVisited || 0}
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary }}
              >
                Places
              </ThemedText>
            </View>
          </Card>

          <Card elevation={1} style={styles.statCard}>
            <View style={styles.statContent}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: theme.secondary + "20" },
                ]}
              >
                <Feather name="globe" size={20} color={theme.secondary} />
              </View>
              <ThemedText type="h2" style={styles.statNumber}>
                {user.countriesVisited || 0}
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary }}
              >
                Countries
              </ThemedText>
            </View>
          </Card>

          <Card elevation={1} style={styles.statCard}>
            <View style={styles.statContent}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: theme.accent + "20" },
                ]}
              >
                <Feather name="star" size={20} color={theme.accent} />
              </View>
              <ThemedText type="h2" style={styles.statNumber}>
                {user.reviewsCount || 0}
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary }}
              >
                Reviews
              </ThemedText>
            </View>
          </Card>
        </View>

        {recentReviews.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Recent Reviews
            </ThemedText>
            {recentReviews.map((review) => (
              <View key={review.id} style={styles.reviewContainer}>
                <ReviewCard
                  review={{
                    ...review,
                    user: {
                      id: user.id,
                      username: user.username,
                      displayName: user.displayName,
                      avatarPreset: user.avatarPreset,
                    },
                  }}
                  showPlace
                  onPlacePress={() => handlePlacePress(review.placeId)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Recent Reviews
            </ThemedText>
            <View style={styles.emptyReviews}>
              <Feather
                name="message-circle"
                size={32}
                color={theme.textSecondary}
              />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No reviews yet
              </ThemedText>
            </View>
          </View>
        )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  bio: {
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  statContent: {
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statNumber: {
    marginBottom: Spacing.xs,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  reviewContainer: {
    marginBottom: Spacing.md,
  },
  emptyReviews: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyText: {
    marginTop: Spacing.sm,
  },
});
