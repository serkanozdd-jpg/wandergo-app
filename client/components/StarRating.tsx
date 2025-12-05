import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  size = 16,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const { theme } = useTheme();

  const stars = [1, 2, 3, 4, 5];

  const renderStar = (starNumber: number) => {
    const filled = rating >= starNumber;
    const halfFilled = rating >= starNumber - 0.5 && rating < starNumber;

    const Star = (
      <Feather
        name="star"
        size={size}
        color={filled || halfFilled ? theme.starFill : theme.starEmpty}
        style={filled ? { opacity: 1 } : { opacity: halfFilled ? 0.5 : 0.3 }}
      />
    );

    if (interactive && onRatingChange) {
      return (
        <Pressable
          key={starNumber}
          onPress={() => onRatingChange(starNumber)}
          style={({ pressed }) => [
            styles.starButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {Star}
        </Pressable>
      );
    }

    return (
      <View key={starNumber} style={styles.star}>
        {Star}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {stars.map(renderStar)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    marginRight: 2,
  },
  starButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
});
