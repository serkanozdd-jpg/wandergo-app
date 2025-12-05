import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

const AVATAR_COLORS = [
  { bg: "#00B4A0", icon: "user" },
  { bg: "#FF6B35", icon: "compass" },
  { bg: "#6C5CE7", icon: "globe" },
  { bg: "#27AE60", icon: "map-pin" },
  { bg: "#3498DB", icon: "camera" },
  { bg: "#E74C3C", icon: "heart" },
];

interface AvatarProps {
  preset?: number;
  size?: number;
  name?: string;
}

export function Avatar({ preset = 0, size = 40, name }: AvatarProps) {
  const { theme } = useTheme();

  const avatarConfig = AVATAR_COLORS[preset % AVATAR_COLORS.length];
  const iconSize = Math.floor(size * 0.5);
  const fontSize = Math.floor(size * 0.4);

  if (name) {
    const initial = name.charAt(0).toUpperCase();
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: avatarConfig.bg,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={{ color: "#FFFFFF", fontSize, fontWeight: "600" }}
        >
          {initial}
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarConfig.bg,
        },
      ]}
    >
      <Feather
        name={avatarConfig.icon as any}
        size={iconSize}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
