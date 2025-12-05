import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface CategoryChipProps {
  name: string;
  icon?: keyof typeof Feather.glyphMap;
  isSelected?: boolean;
  onPress?: () => void;
}

export function CategoryChip({
  name,
  icon,
  isSelected = false,
  onPress,
}: CategoryChipProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
          borderColor: isSelected ? theme.primary : theme.border,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      {icon ? (
        <Feather
          name={icon}
          size={16}
          color={isSelected ? "#FFFFFF" : theme.text}
          style={styles.icon}
        />
      ) : null}
      <ThemedText
        type="small"
        style={{
          color: isSelected ? "#FFFFFF" : theme.text,
          fontWeight: isSelected ? "600" : "400",
        }}
      >
        {name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: Spacing.xs,
  },
});
