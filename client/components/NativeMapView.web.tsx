import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";

export default function NativeMapView() {
  return (
    <View style={styles.container}>
      <Feather name="map" size={64} color="#888" />
      <ThemedText type="body" style={styles.text}>
        Harita sadece mobil uygulamada çalışır
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  text: {
    textAlign: "center",
    color: "#888",
  },
});
