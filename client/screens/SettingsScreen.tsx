import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, logout, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarPreset, setAvatarPreset] = useState(user?.avatarPreset || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarPreset,
      });
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Profile Picture
          </ThemedText>
          <View style={styles.avatarSection}>
            <Avatar preset={avatarPreset} size={80} />
            <Pressable
              style={({ pressed }) => [
                styles.changeAvatarButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => setShowAvatarPicker(!showAvatarPicker)}
            >
              <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                Change
              </ThemedText>
            </Pressable>
          </View>
          
          {showAvatarPicker ? (
            <View style={styles.avatarPicker}>
              {[0, 1, 2, 3, 4, 5].map((preset) => (
                <Pressable
                  key={preset}
                  style={({ pressed }) => [
                    styles.avatarOption,
                    avatarPreset === preset && {
                      borderColor: theme.primary,
                      borderWidth: 2,
                    },
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => {
                    setAvatarPreset(preset);
                    setShowAvatarPicker(false);
                  }}
                >
                  <Avatar preset={preset} size={50} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </Card>

        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Display Name
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
          />
        </Card>

        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Bio
          </ThemedText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others about yourself..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText type="body" style={styles.saveButtonText}>
              Save Changes
            </ThemedText>
          )}
        </Pressable>

        <View style={styles.divider} />

        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <View style={styles.accountInfo}>
            <Feather name="user" size={18} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={[styles.username, { color: theme.textSecondary }]}
            >
              @{user?.username}
            </ThemedText>
          </View>
        </Card>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { borderColor: theme.error, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={18} color={theme.error} />
          <ThemedText
            type="body"
            style={[styles.logoutText, { color: theme.error }]}
          >
            Sign Out
          </ThemedText>
        </Pressable>

        <ThemedText
          type="caption"
          style={[styles.version, { color: theme.textSecondary }]}
        >
          WanderGo v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeAvatarButton: {
    marginLeft: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  avatarPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  avatarOption: {
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 16,
  },
  saveButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E1E8ED",
    marginVertical: Spacing.lg,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    marginLeft: Spacing.sm,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginTop: Spacing.md,
  },
  logoutText: {
    marginLeft: Spacing.sm,
    fontWeight: "600",
  },
  version: {
    textAlign: "center",
    marginTop: Spacing["2xl"],
  },
});
