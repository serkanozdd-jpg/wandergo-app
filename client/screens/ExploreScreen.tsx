import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";
import NativeMapView from "@/components/NativeMapView";

export default function ExploreScreen() {
  const { theme } = useTheme();
  const [location] = useState({
    latitude: 41.0890,
    longitude: 28.6428,
  });

  if (Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.placeholder}>
          <Feather name="map" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={styles.title}>
            Harita
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Harita sadece mobil uygulamada çalışır. Expo Go veya APK kullanın.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <NativeMapView
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        markers={[{
          id: "current",
          coordinate: location,
          title: "Benim Konumum",
        }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    marginTop: Spacing.lg,
  },
});
