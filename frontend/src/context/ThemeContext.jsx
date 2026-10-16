import React, { createContext, useContext, useState, useEffect, useRef } from "react";

// =====================================================
// AVAILABLE ACCENT COLOR PALETTES
// =====================================================
export const COLOR_PALETTES = {
  blue: {
    id: "blue",
    name: "Ocean Blue",
    hex: "#2563eb",
    darkHex: "#3b82f6",
    light: {
      primary: "#2563eb",
      hover: "#1d4ed8",
      light: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
      glow: "rgba(37, 99, 235, 0.25)",
    },
    dark: {
      primary: "#3b82f6",
      hover: "#60a5fa",
      light: "rgba(59, 130, 246, 0.18)",
      border: "rgba(59, 130, 246, 0.35)",
      text: "#93c5fd",
      glow: "rgba(59, 130, 246, 0.35)",
    },
  },
  indigo: {
    id: "indigo",
    name: "Royal Indigo",
    hex: "#4f46e5",
    darkHex: "#6366f1",
    light: {
      primary: "#4f46e5",
      hover: "#4338ca",
      light: "#eef2ff",
      border: "#c7d2fe",
      text: "#4338ca",
      glow: "rgba(79, 70, 229, 0.25)",
    },
    dark: {
      primary: "#6366f1",
      hover: "#818cf8",
      light: "rgba(99, 102, 241, 0.18)",
      border: "rgba(99, 102, 241, 0.35)",
      text: "#a5b4fc",
      glow: "rgba(99, 102, 241, 0.35)",
    },
  },
  purple: {
    id: "purple",
    name: "Amethyst Purple",
    hex: "#7c3aed",
    darkHex: "#8b5cf6",
    light: {
      primary: "#7c3aed",
      hover: "#6d28d9",
      light: "#f5f3ff",
      border: "#ddd6fe",
      text: "#6d28d9",
      glow: "rgba(124, 58, 237, 0.25)",
    },
    dark: {
      primary: "#8b5cf6",
      hover: "#a78bfa",
      light: "rgba(139, 92, 246, 0.18)",
      border: "rgba(139, 92, 246, 0.35)",
      text: "#c4b5fd",
      glow: "rgba(139, 92, 246, 0.35)",
    },
  },
  emerald: {
    id: "emerald",
    name: "Emerald Green",
    hex: "#059669",
    darkHex: "#10b981",
    light: {
      primary: "#059669",
      hover: "#047857",
      light: "#ecfdf5",
      border: "#a7f3d0",
      text: "#047857",
      glow: "rgba(5, 150, 105, 0.25)",
    },
    dark: {
      primary: "#10b981",
      hover: "#34d399",
      light: "rgba(16, 185, 129, 0.18)",
      border: "rgba(16, 185, 129, 0.35)",
      text: "#6ee7b7",
      glow: "rgba(16, 185, 129, 0.35)",
    },
  },
  cyan: {
    id: "cyan",
    name: "Electric Cyan",
    hex: "#0891b2",
    darkHex: "#06b6d4",
    light: {
      primary: "#0891b2",
      hover: "#0e7490",
      light: "#ecfeff",
      border: "#a5f3fc",
      text: "#0e7490",
      glow: "rgba(8, 145, 178, 0.25)",
    },
    dark: {
      primary: "#06b6d4",
      hover: "#22d3ee",
      light: "rgba(6, 182, 212, 0.18)",
      border: "rgba(6, 182, 212, 0.35)",
      text: "#67e8f9",
      glow: "rgba(6, 182, 212, 0.35)",
    },
  },
  rose: {
    id: "rose",
    name: "Sunset Rose",
    hex: "#e11d48",
    darkHex: "#f43f5e",
    light: {
      primary: "#e11d48",
      hover: "#be123c",
      light: "#fff1f2",
      border: "#fecdd3",
      text: "#be123c",
      glow: "rgba(225, 29, 72, 0.25)",
    },
    dark: {
      primary: "#f43f5e",
      hover: "#fb7185",
      light: "rgba(244, 63, 94, 0.18)",
      border: "rgba(244, 63, 94, 0.35)",
      text: "#fda4af",
      glow: "rgba(244, 63, 94, 0.35)",
    },
  },
  amber: {
    id: "amber",
    name: "Warm Amber",
    hex: "#d97706",
    darkHex: "#f59e0b",
    light: {
      primary: "#d97706",
      hover: "#b45309",
      light: "#fffbeb",
      border: "#fde68a",
      text: "#b45309",
      glow: "rgba(217, 119, 6, 0.25)",
    },
    dark: {
      primary: "#f59e0b",
      hover: "#fbbf24",
      light: "rgba(245, 158, 11, 0.18)",
      border: "rgba(245, 158, 11, 0.35)",
      text: "#fcd34d",
      glow: "rgba(245, 158, 11, 0.35)",
    },
  },
};

export const AVAILABLE_COLORS = Object.values(COLOR_PALETTES);

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const transitionTimerRef = useRef(null);

  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem("appTheme") || localStorage.getItem("adminTheme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (e) {
      console.error("Theme reading error:", e);
    }
    return "light";
  };

  const getInitialColor = () => {
    try {
      const savedColor = localStorage.getItem("appColorTheme") || localStorage.getItem("adminColorTheme");
      if (savedColor && COLOR_PALETTES[savedColor]) {
        return savedColor;
      }
    } catch (e) {
      console.error("Color reading error:", e);
    }
    return "blue";
  };

  const [theme, setThemeState] = useState(getInitialTheme);
  const [colorTheme, setColorThemeState] = useState(getInitialColor);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Apply theme and color variables to DOM with smooth transition
  const applyThemeToDOM = (themeMode, colorKey) => {
    const root = document.documentElement;

    // 1. Mark transitioning state for smooth animation
    root.classList.add("theme-transitioning");
    setIsTransitioning(true);

    // 2. Apply dark/light class
    if (themeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.setAttribute("data-theme", themeMode);

    // 3. Apply accent color data attribute
    const palette = COLOR_PALETTES[colorKey] || COLOR_PALETTES.blue;
    root.setAttribute("data-color", palette.id);

    // 4. Inject CSS custom properties for dynamic theming
    const tokens = themeMode === "dark" ? palette.dark : palette.light;
    root.style.setProperty("--primary", tokens.primary);
    root.style.setProperty("--primary-hover", tokens.hover);
    root.style.setProperty("--primary-light", tokens.light);
    root.style.setProperty("--primary-border", tokens.border);
    root.style.setProperty("--primary-text", tokens.text);
    root.style.setProperty("--primary-glow", tokens.glow);
    root.style.setProperty("--color-primary", tokens.primary);
    root.style.setProperty("--color-primary-hover", tokens.hover);
    root.style.setProperty("--color-primary-light", tokens.light);
    root.style.setProperty("--color-primary-border", tokens.border);
    root.style.setProperty("--color-primary-text", tokens.text);
    root.style.setProperty("--color-primary-glow", tokens.glow);

    // 5. Clean up transition class after transition duration
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      root.classList.remove("theme-transitioning");
      setIsTransitioning(false);
    }, 350);
  };

  useEffect(() => {
    applyThemeToDOM(theme, colorTheme);
    localStorage.setItem("appTheme", theme);
    localStorage.setItem("adminTheme", theme);
    localStorage.setItem("appColorTheme", colorTheme);
    localStorage.setItem("adminColorTheme", colorTheme);
    window.dispatchEvent(new Event("themeChanged"));
    window.dispatchEvent(new Event("colorChanged"));
  }, [theme, colorTheme]);

  // Synchronize across tabs or custom storage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (
        e.key === "appTheme" ||
        e.key === "adminTheme" ||
        e.key === "appColorTheme" ||
        e.type === "themeChanged" ||
        e.type === "colorChanged"
      ) {
        const currentSavedTheme =
          localStorage.getItem("appTheme") || localStorage.getItem("adminTheme") || "light";
        const currentSavedColor =
          localStorage.getItem("appColorTheme") || localStorage.getItem("adminColorTheme") || "blue";
        setThemeState(currentSavedTheme);
        setColorThemeState(currentSavedColor);
        applyThemeToDOM(currentSavedTheme, currentSavedColor);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("themeChanged", handleStorage);
    window.addEventListener("colorChanged", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("themeChanged", handleStorage);
      window.removeEventListener("colorChanged", handleStorage);
    };
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme) => {
    if (newTheme === "dark" || newTheme === "light") {
      setThemeState(newTheme);
    }
  };

  const setColorTheme = (newColor) => {
    if (COLOR_PALETTES[newColor]) {
      setColorThemeState(newColor);
    }
  };

  const contextValue = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === "dark",
    colorTheme,
    setColorTheme,
    availableColors: AVAILABLE_COLORS,
    activePalette: COLOR_PALETTES[colorTheme] || COLOR_PALETTES.blue,
    isTransitioning,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    const savedTheme = localStorage.getItem("appTheme") || localStorage.getItem("adminTheme") || "light";
    const savedColor = localStorage.getItem("appColorTheme") || "blue";
    return {
      theme: savedTheme,
      isDark: savedTheme === "dark",
      colorTheme: savedColor,
      availableColors: AVAILABLE_COLORS,
      activePalette: COLOR_PALETTES[savedColor] || COLOR_PALETTES.blue,
      isTransitioning: false,
      toggleTheme: () => {
        const next = savedTheme === "dark" ? "light" : "dark";
        localStorage.setItem("appTheme", next);
        localStorage.setItem("adminTheme", next);
        window.dispatchEvent(new Event("themeChanged"));
      },
      setTheme: (next) => {
        localStorage.setItem("appTheme", next);
        localStorage.setItem("adminTheme", next);
        window.dispatchEvent(new Event("themeChanged"));
      },
      setColorTheme: (next) => {
        localStorage.setItem("appColorTheme", next);
        window.dispatchEvent(new Event("colorChanged"));
      },
    };
  }
  return context;
};

// Aliases for ColorContext naming
export const ColorContext = ThemeContext;
export const useColorContext = useTheme;
export const useColor = useTheme;

export default ThemeContext;
