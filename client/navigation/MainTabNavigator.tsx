import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import DiscoverScreen from "@/screens/DiscoverScreen";
import RoutesScreen from "@/screens/RoutesScreen";
import ExploreScreen from "@/screens/ExploreScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export type MainTabParamList = {
  Discover: undefined;
  Routes: undefined;
  Explore: undefined;
  Community: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Discover"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: Spacing.tabBarHeight,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Routes"
        component={RoutesScreen}
        options={{
          title: "Routes",
          tabBarIcon: ({ color, size }) => (
            <Feather name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.exploreIcon,
                {
                  backgroundColor: focused ? theme.secondary : theme.backgroundSecondary,
                },
              ]}
            >
              <Feather
                name="globe"
                size={size}
                color={focused ? "#FFFFFF" : color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: "Reviews",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  exploreIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
});
