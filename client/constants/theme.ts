import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#2C3E50",
    textSecondary: "#6C757D",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6C757D",
    tabIconSelected: "#00B4A0",
    link: "#00B4A0",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F8F9FA",
    backgroundSecondary: "#F0F2F4",
    backgroundTertiary: "#E1E8ED",
    primary: "#00B4A0",
    secondary: "#FF6B35",
    accent: "#6C5CE7",
    success: "#27AE60",
    warning: "#F39C12",
    error: "#E74C3C",
    info: "#3498DB",
    border: "#E1E8ED",
    starFill: "#FFB800",
    starEmpty: "#E1E8ED",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#00D4C0",
    link: "#00D4C0",
    backgroundRoot: "#1A1D1F",
    backgroundDefault: "#252729",
    backgroundSecondary: "#2F3235",
    backgroundTertiary: "#3A3D41",
    primary: "#00D4C0",
    secondary: "#FF8255",
    accent: "#8B7CF7",
    success: "#2ECC71",
    warning: "#F5AB35",
    error: "#E74C3C",
    info: "#5DADE2",
    border: "#3A3D41",
    starFill: "#FFB800",
    starEmpty: "#3A3D41",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 56,
  inputHeight: 48,
  buttonHeight: 48,
  tabBarHeight: 60,
  fabSize: 56,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
