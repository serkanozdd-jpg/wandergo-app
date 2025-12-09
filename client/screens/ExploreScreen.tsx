import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";

let GoogleMapsView: React.ComponentType<any> | null = null;
let AppleMapsView: React.ComponentType<any> | null = null;

if (Platform.OS !== "web") {
  try {
    const ExpoMaps = require("expo-maps");
    GoogleMapsView = ExpoMaps.GoogleMaps?.View;
    AppleMapsView = ExpoMaps.AppleMaps?.View;
  } catch (e) {
    console.log("expo-maps not available:", e);
  }
}

export default function ExploreScreen() {
  const { theme } = useTheme();
  const [location] = useState({
    latitude: 41.0890,
    longitude: 28.6428,
  });

  const MapComponent = Platform.OS === "ios" ? AppleMapsView : GoogleMapsView;
  const canShowMap = Platform.OS !== "web" && MapComponent !== null;

  if (!canShowMap) {
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
      <MapComponent
        style={styles.map}
        cameraPosition={{
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          zoom: 15,
        }}
        markers={[
          {
            id: "my-location",
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            title: "Benim Konumum",
          },
        ]}
        uiSettings={{
          zoomControlsEnabled: true,
          compassEnabled: true,
          myLocationButtonEnabled: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
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
