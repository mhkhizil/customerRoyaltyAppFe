/**
 * Shop brand theme presets.
 *
 * Change colors here (or add a new preset) when white-labeling for another shop.
 * UI must consume tokens via Tailwind classes (`bg-brand`, `text-accent`, etc.)
 * or CSS variables (`var(--shop-brand)`), never hard-coded hex in components.
 */

export type ShopThemeColors = {
  brand: string;
  brandStrong: string;
  brandSoft: string;
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
};

export type ShopThemePreset = {
  id: string;
  name: string;
  light: ShopThemeColors;
  dark: ShopThemeColors;
};

/** Default Customer Royalty App look: warm gold rewards + trustworthy navy accent. */
export const customerRoyaltyDefaultTheme: ShopThemePreset = {
  id: "customer-royalty-default",
  name: "Customer Royalty Default",
  light: {
    brand: "#B8860B",
    brandStrong: "#8B6914",
    brandSoft: "#F7ECD0",
    accent: "#1E3A5F",
    accentSoft: "#E8EEF5",
    surface: "#FFFBF5",
    surfaceMuted: "#F5F0E8",
    text: "#1F2937",
    textMuted: "#64748B",
    border: "#E7DFD1",
    success: "#15803D",
    danger: "#DC2626",
  },
  dark: {
    brand: "#D4AF37",
    brandStrong: "#F0C75E",
    brandSoft: "#3D3420",
    accent: "#243B53",
    accentSoft: "#1A2A3D",
    surface: "#111827",
    surfaceMuted: "#1F2937",
    text: "#F9FAFB",
    textMuted: "#94A3B8",
    border: "#374151",
    success: "#22C55E",
    danger: "#F87171",
  },
};

export const shopThemePresets: Record<string, ShopThemePreset> = {
  [customerRoyaltyDefaultTheme.id]: customerRoyaltyDefaultTheme,
};

export const DEFAULT_SHOP_THEME_ID = customerRoyaltyDefaultTheme.id;

export function resolveShopThemeId(themeId?: string): string {
  if (themeId && shopThemePresets[themeId]) {
    return themeId;
  }
  return DEFAULT_SHOP_THEME_ID;
}

export function getShopThemePreset(themeId?: string): ShopThemePreset {
  return shopThemePresets[resolveShopThemeId(themeId)];
}
