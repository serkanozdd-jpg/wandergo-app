import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(username.trim(), password);
        if (!result.success) {
          Alert.alert("Login Failed", result.error || "Invalid credentials");
        }
      } else {
        const result = await register(
          username.trim(),
          password,
          displayName.trim() || username.trim()
        );
        if (!result.success) {
          Alert.alert("Registration Failed", result.error || "Could not create account");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h1" style={styles.title}>
            WanderGo
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Your intelligent travel companion
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.tabContainer}>
            <Pressable
              style={[
                styles.tab,
                isLogin && { backgroundColor: theme.primary },
              ]}
              onPress={() => setIsLogin(true)}
            >
              <ThemedText
                type="body"
                style={[
                  styles.tabText,
                  { color: isLogin ? "#FFFFFF" : theme.text },
                ]}
              >
                Sign In
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                !isLogin && { backgroundColor: theme.primary },
              ]}
              onPress={() => setIsLogin(false)}
            >
              <ThemedText
                type="body"
                style={[
                  styles.tabText,
                  { color: !isLogin ? "#FFFFFF" : theme.text },
                ]}
              >
                Sign Up
              </ThemedText>
            </Pressable>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <ThemedText type="small" style={styles.label}>
                Display Name
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Username
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Password
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="body" style={styles.buttonText}>
                {isLogin ? "Sign In" : "Create Account"}
              </ThemedText>
            )}
          </Pressable>
        </View>

        <ThemedText
          type="caption"
          style={[styles.terms, { color: theme.textSecondary }]}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  form: {
    marginBottom: Spacing["2xl"],
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  terms: {
    textAlign: "center",
    marginTop: "auto",
  },
});
