import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

type MarkerData = {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description?: string;
};

type NativeMapViewProps = {
  initialRegion: Region;
  markers?: MarkerData[];
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  style?: any;
  mapRef?: React.RefObject<any>;
  children?: React.ReactNode;
};

export default function NativeMapView({
  initialRegion,
  markers = [],
  showsUserLocation = false,
  showsMyLocationButton = false,
  rotateEnabled = true,
  pitchEnabled = true,
  style,
  mapRef,
  children,
}: NativeMapViewProps) {
  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      rotateEnabled={rotateEnabled}
      pitchEnabled={pitchEnabled}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
        />
      ))}
      {children}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
