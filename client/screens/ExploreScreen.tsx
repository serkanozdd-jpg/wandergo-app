import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";

let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;

if (Platform.OS !== "web") {
  try {
    const RNMaps = require("react-native-maps");
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
  } catch (e) {
    console.log("react-native-maps not available:", e);
  }
}

export default function ExploreScreen() {
  const { theme } = useTheme();
  const [location] = useState({
    latitude: 41.0890,
    longitude: 28.6428,
  });

  const canShowMap = Platform.OS !== "web" && MapView !== null;

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

  const MapComponent = MapView!;
  
  return (
    <View style={styles.container}>
      <MapComponent
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {Marker ? (
          <Marker
            coordinate={location}
            title="Benim Konumum"
          />
        ) : null}
      </MapComponent>
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
