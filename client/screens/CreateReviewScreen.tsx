import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { StarRating } from "@/components/StarRating";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { createReview } from "@/lib/api";

export default function CreateReviewScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, "CreateReview">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const { placeId, placeName } = route.params;

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      await createReview(placeId, {
        rating,
        content: content.trim() || undefined,
      });
      Alert.alert("Success", "Your review has been posted!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to post review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <ThemedText
              type="body"
              style={{
                color: rating === 0 ? theme.textSecondary : theme.primary,
                fontWeight: "600",
              }}
            >
              Post
            </ThemedText>
          )}
        </Pressable>
      ),
    });
  }, [navigation, rating, isSubmitting, theme, handleSubmit]);

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="h3" style={styles.placeName}>
            {placeName}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Share your experience
          </ThemedText>
        </View>

        <View style={styles.ratingSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Your Rating
          </ThemedText>
          <StarRating
            rating={rating}
            size={40}
            interactive
            onRatingChange={setRating}
          />
          {rating > 0 ? (
            <ThemedText
              type="body"
              style={[styles.ratingLabel, { color: theme.primary }]}
            >
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.reviewSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Your Review (Optional)
          </ThemedText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder="Tell others about your experience..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <ThemedText
            type="caption"
            style={[styles.charCount, { color: theme.textSecondary }]}
          >
            {content.length} / 500
          </ThemedText>
        </View>

        <View style={styles.tips}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Tips for a Great Review
          </ThemedText>
          <View style={styles.tipItem}>
            <Feather name="check" size={16} color={theme.success} />
            <ThemedText
              type="small"
              style={[styles.tipText, { color: theme.textSecondary }]}
            >
              Describe what made this place special
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Feather name="check" size={16} color={theme.success} />
            <ThemedText
              type="small"
              style={[styles.tipText, { color: theme.textSecondary }]}
            >
              Share useful tips for future visitors
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Feather name="check" size={16} color={theme.success} />
            <ThemedText
              type="small"
              style={[styles.tipText, { color: theme.textSecondary }]}
            >
              Mention the best time to visit
            </ThemedText>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  placeName: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  ratingLabel: {
    marginTop: Spacing.md,
    fontWeight: "600",
  },
  reviewSection: {
    marginBottom: Spacing["2xl"],
  },
  textArea: {
    minHeight: 120,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 16,
  },
  charCount: {
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  tips: {
    marginTop: Spacing.lg,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tipText: {
    marginLeft: Spacing.sm,
  },
});
