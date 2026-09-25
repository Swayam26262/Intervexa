export type ThemePreference = "system" | "light" | "dark";
export const THEME_COOKIE = "ivx-theme";

export function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
  document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=31536000; samesite=lax`;
}
