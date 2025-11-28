/**
 * Local storage utilities for persisting app state
 * All data is stored client-side only, never sent to any server
 *
 * @module storage
 */

import type { ApiKeyConfig, AppSettings } from "@/types";

/** Storage keys used in localStorage */
const STORAGE_KEYS = {
  API_KEY_CONFIG: "maze_race_api_key_config",
  SETTINGS: "maze_race_settings",
} as const;

/**
 * Simple XOR encryption for API key storage
 * Not cryptographically secure, but provides basic obfuscation
 *
 * @param key - The API key to encrypt
 * @returns Base64-encoded encrypted key
 */
function encryptKey(key: string): string {
  const secret = "maze-race-2025";
  return btoa(
    key
      .split("")
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length),
        ),
      )
      .join(""),
  );
}

/**
 * Decrypt the stored API key
 *
 * @param encrypted - The encrypted key string
 * @returns Decrypted API key, or empty string if decryption fails
 */
function decryptKey(encrypted: string): string {
  const secret = "maze-race-2025";
  try {
    return atob(encrypted)
      .split("")
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length),
        ),
      )
      .join("");
  } catch {
    return "";
  }
}

/**
 * Save API key configuration to localStorage (encrypted)
 * All keys are encrypted before storage for basic security
 *
 * @param config - The API key configuration to save
 *
 * @example
 * ```tsx
 * saveApiKeyConfig({
 *   type: "gateway",
 *   gatewayKey: "your-api-key"
 * })
 * ```
 */
export function saveApiKeyConfig(config: ApiKeyConfig): void {
  if (typeof window === "undefined") return;
  try {
    const encryptedConfig: ApiKeyConfig = {
      type: config.type,
      gatewayKey: config.gatewayKey ? encryptKey(config.gatewayKey) : undefined,
      providerKeys: config.providerKeys
        ? {
            openai: config.providerKeys.openai
              ? encryptKey(config.providerKeys.openai)
              : undefined,
            anthropic: config.providerKeys.anthropic
              ? encryptKey(config.providerKeys.anthropic)
              : undefined,
            xai: config.providerKeys.xai
              ? encryptKey(config.providerKeys.xai)
              : undefined,
            google: config.providerKeys.google
              ? encryptKey(config.providerKeys.google)
              : undefined,
            mistral: config.providerKeys.mistral
              ? encryptKey(config.providerKeys.mistral)
              : undefined,
            deepseek: config.providerKeys.deepseek
              ? encryptKey(config.providerKeys.deepseek)
              : undefined,
            groq: config.providerKeys.groq
              ? encryptKey(config.providerKeys.groq)
              : undefined,
          }
        : undefined,
    };
    localStorage.setItem(
      STORAGE_KEYS.API_KEY_CONFIG,
      JSON.stringify(encryptedConfig),
    );
  } catch (error) {
    console.error("[v0] Failed to save API key config:", error);
  }
}

/**
 * Load API key configuration from localStorage (decrypted)
 *
 * @returns The decrypted API key configuration, or null if not found
 *
 * @example
 * ```tsx
 * const config = loadApiKeyConfig()
 * if (config) {
 *   // Use the configuration
 * }
 * ```
 */
export function loadApiKeyConfig(): ApiKeyConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.API_KEY_CONFIG);
    if (!stored) return null;

    const encryptedConfig: ApiKeyConfig = JSON.parse(stored);

    return {
      type: encryptedConfig.type,
      gatewayKey: encryptedConfig.gatewayKey
        ? decryptKey(encryptedConfig.gatewayKey)
        : undefined,
      providerKeys: encryptedConfig.providerKeys
        ? {
            openai: encryptedConfig.providerKeys.openai
              ? decryptKey(encryptedConfig.providerKeys.openai)
              : undefined,
            anthropic: encryptedConfig.providerKeys.anthropic
              ? decryptKey(encryptedConfig.providerKeys.anthropic)
              : undefined,
            xai: encryptedConfig.providerKeys.xai
              ? decryptKey(encryptedConfig.providerKeys.xai)
              : undefined,
            google: encryptedConfig.providerKeys.google
              ? decryptKey(encryptedConfig.providerKeys.google)
              : undefined,
            mistral: encryptedConfig.providerKeys.mistral
              ? decryptKey(encryptedConfig.providerKeys.mistral)
              : undefined,
            deepseek: encryptedConfig.providerKeys.deepseek
              ? decryptKey(encryptedConfig.providerKeys.deepseek)
              : undefined,
            groq: encryptedConfig.providerKeys.groq
              ? decryptKey(encryptedConfig.providerKeys.groq)
              : undefined,
          }
        : undefined,
    };
  } catch (error) {
    console.error("[v0] Failed to load API key config:", error);
    return null;
  }
}

/**
 * Get the primary API key (gateway key or first provider key)
 * Returns the key that should be used for API requests
 *
 * @returns The primary API key string, or null if no key is configured
 *
 * @example
 * ```tsx
 * const apiKey = getPrimaryApiKey()
 * if (apiKey) {
 *   // Use the key for API requests
 * }
 * ```
 */
export function getPrimaryApiKey(): string | null {
  const config = loadApiKeyConfig();
  if (!config) return null;

  if (config.type === "gateway" && config.gatewayKey) {
    return config.gatewayKey;
  }

  if (config.type === "provider" && config.providerKeys) {
    return (
      config.providerKeys.openai ||
      config.providerKeys.anthropic ||
      config.providerKeys.xai ||
      config.providerKeys.google ||
      config.providerKeys.mistral ||
      config.providerKeys.deepseek ||
      config.providerKeys.groq ||
      null
    );
  }

  return null;
}

/**
 * Remove API key configuration from localStorage
 * Permanently deletes all stored API key data
 */
export function clearApiKeyConfig(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.API_KEY_CONFIG);
  } catch (error) {
    console.error("[v0] Failed to clear API key config:", error);
  }
}

/**
 * Default app settings used when no saved settings exist
 */
const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  lastSelectedModels: [],
  gamesPlayed: 0,
  totalRaceTime: 0,
  debugMode: false,
};

/**
 * Load settings from localStorage
 * Returns default settings if none are stored
 *
 * @returns The loaded or default app settings
 *
 * @example
 * ```tsx
 * const settings = loadSettings()
 * console.log(settings.theme) // "dark" or "light"
 * ```
 */
export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (error) {
    console.error("[v0] Failed to load settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage
 * Merges with existing settings, only updating provided fields
 *
 * @param settings - Partial settings object to save
 *
 * @example
 * ```tsx
 * saveSettings({ theme: "light", debugMode: true })
 * ```
 */
export function saveSettings(settings: Partial<AppSettings>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error("[v0] Failed to save settings:", error);
  }
}

/**
 * Increment games played counter
 * Updates the total games played statistic
 */
export function incrementGamesPlayed(): void {
  const settings = loadSettings();
  saveSettings({ gamesPlayed: settings.gamesPlayed + 1 });
}

/**
 * Add race time to total
 * Accumulates race duration for statistics
 *
 * @param milliseconds - Race duration in milliseconds to add
 */
export function addRaceTime(milliseconds: number): void {
  const settings = loadSettings();
  saveSettings({ totalRaceTime: settings.totalRaceTime + milliseconds });
}
