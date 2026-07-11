export type TextScale = "normal" | "large" | "xlarge";

export interface A11yPreferences {
  textScale: TextScale;
  highContrast: boolean;
}

const STORAGE_KEY = "silentbridge.a11y.v1";

export const DEFAULT_A11Y: A11yPreferences = {
  textScale: "normal",
  highContrast: false
};

export function loadA11yPreferences(): A11yPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_A11Y };
    const parsed = JSON.parse(raw) as Partial<A11yPreferences>;
    const textScale =
      parsed.textScale === "large" || parsed.textScale === "xlarge" ? parsed.textScale : "normal";
    return {
      textScale,
      highContrast: Boolean(parsed.highContrast)
    };
  } catch {
    return { ...DEFAULT_A11Y };
  }
}

export function persistA11yPreferences(prefs: A11yPreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage failures
  }
}

export function cycleTextScale(current: TextScale): TextScale {
  if (current === "normal") return "large";
  if (current === "large") return "xlarge";
  return "normal";
}

export function textScaleLabel(scale: TextScale): string {
  if (scale === "large") return "大字";
  if (scale === "xlarge") return "特大";
  return "标准";
}
