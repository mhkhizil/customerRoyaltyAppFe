import type { ThemeMode } from "./ThemeContext";
import {
  DEFAULT_SHOP_THEME_ID,
  getShopThemePreset,
  resolveShopThemeId,
  type ShopThemeColors,
} from "./shopTheme";

const CSS_VAR_MAP: Record<keyof ShopThemeColors, string> = {
  brand: "--shop-brand",
  brandStrong: "--shop-brand-strong",
  brandSoft: "--shop-brand-soft",
  accent: "--shop-accent",
  accentSoft: "--shop-accent-soft",
  surface: "--shop-surface",
  surfaceMuted: "--shop-surface-muted",
  text: "--shop-text",
  textMuted: "--shop-text-muted",
  border: "--shop-border",
  success: "--shop-success",
  danger: "--shop-danger",
};

function applyColors(root: HTMLElement, colors: ShopThemeColors): void {
  (Object.entries(CSS_VAR_MAP) as Array<[keyof ShopThemeColors, string]>).forEach(
    ([key, cssVar]) => {
      root.style.setProperty(cssVar, colors[key]);
    }
  );
}

/**
 * Applies the active shop palette to the document root.
 * Call once on boot and whenever shop preset or light/dark mode changes.
 */
export function applyShopTheme(
  mode: ThemeMode,
  shopThemeId: string = DEFAULT_SHOP_THEME_ID
): void {
  if (typeof document === "undefined") return;

  const preset = getShopThemePreset(resolveShopThemeId(shopThemeId));
  const colors = mode === "dark" ? preset.dark : preset.light;
  applyColors(document.documentElement, colors);
  document.documentElement.dataset.shopTheme = preset.id;
}

export function getConfiguredShopThemeId(): string {
  return resolveShopThemeId(import.meta.env.VITE_SHOP_THEME_ID);
}
