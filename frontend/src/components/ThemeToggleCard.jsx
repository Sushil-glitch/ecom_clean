import React from "react";
import { Sun, Moon, Palette, Check, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const ThemeToggleCard = ({ compact = false, className = "" }) => {
  const {
    isDark,
    toggleTheme,
    setTheme,
    colorTheme,
    setColorTheme,
    availableColors,
    activePalette,
  } = useTheme();

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-xs transition-colors"
            style={{ backgroundColor: isDark ? activePalette.dark.primary : activePalette.light.primary }}
          >
            <Palette size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Display Theme</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isDark ? "Dark Mode" : "Light Mode"} • {activePalette.name}
            </p>
          </div>
        </div>

        {/* Small Toggle Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isDark ? "bg-blue-600" : "bg-slate-200"
          }`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
              isDark ? "translate-x-5" : "translate-x-0"
            }`}
          >
            {isDark ? (
              <Moon size={13} className="text-blue-600" />
            ) : (
              <Sun size={13} className="text-amber-500" />
            )}
          </span>
        </button>
      </div>
    );
  }

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 ${className}`}>
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-colors"
            style={{ backgroundColor: isDark ? activePalette.dark.primary : activePalette.light.primary }}
          >
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Appearance, Display Mode & Accent Colors
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize dark/light presentation and brand accent palette with butter-smooth transitions.
            </p>
          </div>
        </div>

        {/* DISPLAY MODE PILLS (LIGHT / DARK) */}
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700/80 dark:bg-slate-800/90">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              !isDark
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Sun size={15} className={!isDark ? "text-amber-500" : "text-slate-400"} />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              isDark
                ? "bg-slate-700 text-white shadow-sm border border-slate-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Moon size={15} className={isDark ? "text-amber-300" : "text-slate-400"} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* ACCENT COLOR PALETTES */}
      <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Accent Color Palette
          </span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Current: <span className="font-bold text-blue-600">{activePalette.name}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {availableColors.map((color) => {
            const isSelected = colorTheme === color.id;
            const primaryColor = isDark ? color.dark.primary : color.light.primary;

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => setColorTheme(color.id)}
                className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/50 shadow-sm dark:border-blue-400 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSelected && <Check size={16} className="text-white drop-shadow-xs stroke-[3]" />}
                </div>

                <span
                  className={`text-xs font-medium text-center ${
                    isSelected
                      ? "font-bold text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIVE THEME & ACCENT PREVIEW */}
      <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Live Preview
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sample Badge */}
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 border border-blue-200/60">
              Active Badge
            </span>

            {/* Sample Button */}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
            >
              Primary Button
            </button>

            {/* Sample Outline Tab */}
            <span className="rounded-lg border border-blue-500 px-3 py-1 text-xs font-bold text-blue-600">
              Selected Tab
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThemeToggleCard;
