import { useThemeStore } from "../../store/themeStore";

/**
 * Hook для работы с темой приложения
 * @returns {Object} - объект с текущей темой и методами для её управления
 * @example
 * const { theme, toggleTheme, setTheme, isDark, isLight } = useTheme();
 */
export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };
}
