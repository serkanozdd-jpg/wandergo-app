import React from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useOffline } from "@/hooks/useOffline";
import { Spacing, BorderRadius } from "@/constants/theme";

type OfflineIndicatorProps = {
  onPress?: () => void;
};

export function OfflineIndicator({ onPress }: OfflineIndicatorProps) {
  const { theme } = useTheme();
  const { isOnline, pendingActions, isLoading } = useOffline();
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOnline ? -100 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [isOnline, translateY]);

  if (isLoading) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          paddingTop: insets.top + Spacing.xs,
          backgroundColor: theme.warning,
        },
      ]}
    >
      <Pressable style={styles.content} onPress={onPress}>
        <View style={styles.iconContainer}>
          <Feather name="wifi-off" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="body" style={styles.title}>
            You're Offline
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            {pendingActions > 0
              ? `${pendingActions} action${pendingActions > 1 ? "s" : ""} pending sync`
              : "Using cached data"}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Animated.View>
  );
}

export function OfflineBadge() {
  const { theme } = useTheme();
  const { isOnline, isLoading } = useOffline();

  if (isLoading || isOnline) return null;

  return (
    <View style={[styles.badge, { backgroundColor: theme.warning }]}>
      <Feather name="wifi-off" size={12} color="#FFFFFF" />
      <ThemedText type="small" style={styles.badgeText}>
        Offline
      </ThemedText>
    </View>
  );
}

export function SyncIndicator() {
  const { theme } = useTheme();
  const { pendingActions, isOnline } = useOffline();

  if (pendingActions === 0 || !isOnline) return null;

  return (
    <View style={[styles.syncBadge, { backgroundColor: theme.primary }]}>
      <Feather name="refresh-cw" size={14} color="#FFFFFF" />
      <ThemedText type="small" style={styles.badgeText}>
        Syncing...
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
});
