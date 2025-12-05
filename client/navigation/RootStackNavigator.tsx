import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthScreen from "@/screens/AuthScreen";
import PlaceDetailScreen from "@/screens/PlaceDetailScreen";
import CreateReviewScreen from "@/screens/CreateReviewScreen";
import CreateRouteScreen from "@/screens/CreateRouteScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ItineraryPlannerScreen from "@/screens/ItineraryPlannerScreen";
import AchievementsScreen from "@/screens/AchievementsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/lib/auth";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PlaceDetail: { placeId: string };
  CreateReview: { placeId: string; placeName: string };
  CreateRoute: { selectedPlaceIds?: string[] };
  Settings: undefined;
  ItineraryPlanner: undefined;
  Achievements: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PlaceDetail"
            component={PlaceDetailScreen}
            options={{
              headerTitle: "",
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="CreateReview"
            component={CreateReviewScreen}
            options={{
              presentation: "modal",
              headerTitle: "Write Review",
            }}
          />
          <Stack.Screen
            name="CreateRoute"
            component={CreateRouteScreen}
            options={{
              presentation: "modal",
              headerTitle: "Create Route",
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerTitle: "Settings",
            }}
          />
          <Stack.Screen
            name="ItineraryPlanner"
            component={ItineraryPlannerScreen}
            options={{
              headerTitle: "Trip Planner",
            }}
          />
          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{
              headerTitle: "Achievements",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
