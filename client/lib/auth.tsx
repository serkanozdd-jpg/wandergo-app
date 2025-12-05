import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getApiUrl } from "@/lib/query-client";

const AUTH_TOKEN_KEY = "@wandergo_token";
const AUTH_USER_KEY = "@wandergo_user";

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatarPreset?: number | null;
  bio?: string | null;
  placesVisited?: number;
  countriesVisited?: number;
  reviewsCount?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { displayName?: string; avatarPreset?: number; bio?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        refreshUserData(storedToken);
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async (authToken: string) => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      } else if (res.status === 401) {
        await logout();
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await res.json();
      
      setToken(data.token);
      setUser(data.user);
      
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user)),
      ]);
      
      refreshUserData(data.token);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const register = async (
    username: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        username,
        password,
        displayName,
      });
      const data = await res.json();
      
      setToken(data.token);
      setUser(data.user);
      
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user)),
      ]);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Registration failed" };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
  };

  const refreshUser = async () => {
    if (token) {
      await refreshUserData(token);
    }
  };

  const updateProfile = async (data: { displayName?: string; avatarPreset?: number; bio?: string }) => {
    if (!token) return;
    
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/profile", baseUrl);
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(prev => prev ? { ...prev, ...updatedUser } : null);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...user, ...updatedUser }));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}
