import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ReviewCard } from "@/components/ReviewCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getCommunityReviews } from "@/lib/api";

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
  place: {
    id: string;
    name: string;
    city: string;
    country: string;
    imageUrl?: string | null;
  };
};

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await getCommunityReviews(30);
      setReviews(data);
    } catch (error) {
      console.error("Fetch reviews error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchReviews();
  };

  const handlePlacePress = (placeId: string) => {
    navigation.navigate("PlaceDetail", { placeId });
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
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReviewCard
            review={item}
            showPlace
            onPlacePress={() => handlePlacePress(item.placeId)}
          />
        )}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h2">Community</ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Recent reviews from travelers
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={48} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              No reviews yet. Be the first to share!
            </ThemedText>
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
    marginBottom: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
});
