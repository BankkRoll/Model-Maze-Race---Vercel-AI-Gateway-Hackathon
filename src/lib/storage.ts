/**
 * Local storage utilities for persisting app state
 * All data is stored client-side only, never sent to any server
 *
 * @module storage
 */

import { decryptKey, encryptKey } from "@/lib/api-key-crypto";
import type { ApiKeyConfig, AppSettings } from "@/types";

/** Storage keys used in localStorage */
const STORAGE_KEYS = {
  API_KEY_CONFIG: "maze_race_api_key_config",
  SETTINGS: "maze_race_settings",
} as const;

/**
 * Extended API key configuration with metadata
 *
 * @interface ApiKeyConfigWithMetadata
 */
interface ApiKeyConfigWithMetadata {
  /** The API key configuration */
  config: ApiKeyConfig;
  /** Timestamp when the key was saved */
  savedAt: number;
  /** Optional expiration timestamp (in milliseconds) */
  expiresAt?: number;
  /** Version of the storage format */
  version: number;
}

/**
 * Save API key configuration to localStorage (encrypted)
 * All keys are encrypted before storage using Web Crypto API
 *
 * @param config - The API key configuration to save
 * @param expiresInDays - Optional number of days until key expires (default: no expiration)
 * @returns Promise that resolves when save is complete
 *
 * @example
 * ```tsx
 * await saveApiKeyConfig({
 *   type: "gateway",
 *   gatewayKey: "your-api-key"
 * }, 90) // Expires in 90 days
 * ```
 */
export async function saveApiKeyConfig(
  config: ApiKeyConfig,
  expiresInDays?: number,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const expiresAt = expiresInDays
      ? now + expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    /**
     * Encrypt all keys (OIDC type has no keys to encrypt)
     */
    const encryptedConfig: ApiKeyConfig = {
      type: config.type,
      ...(config.type === "oidc"
        ? {}
        : config.type === "gateway"
          ? {
              gatewayKey: config.gatewayKey
                ? await encryptKey(config.gatewayKey)
                : undefined,
            }
          : {
              providerKeys: config.providerKeys
                ? {
                    openai: config.providerKeys.openai
                      ? await encryptKey(config.providerKeys.openai)
                      : undefined,
                    anthropic: config.providerKeys.anthropic
                      ? await encryptKey(config.providerKeys.anthropic)
                      : undefined,
                    xai: config.providerKeys.xai
                      ? await encryptKey(config.providerKeys.xai)
                      : undefined,
                    google: config.providerKeys.google
                      ? await encryptKey(config.providerKeys.google)
                      : undefined,
                    mistral: config.providerKeys.mistral
                      ? await encryptKey(config.providerKeys.mistral)
                      : undefined,
                    deepseek: config.providerKeys.deepseek
                      ? await encryptKey(config.providerKeys.deepseek)
                      : undefined,
                    groq: config.providerKeys.groq
                      ? await encryptKey(config.providerKeys.groq)
                      : undefined,
                  }
                : undefined,
            }),
    };

    const metadata: ApiKeyConfigWithMetadata = {
      config: encryptedConfig,
      savedAt: now,
      expiresAt,
      version: 2,
    };

    localStorage.setItem(STORAGE_KEYS.API_KEY_CONFIG, JSON.stringify(metadata));
  } catch (error) {
    console.error("Failed to save API key config:", error);
    throw error;
  }
}

/**
 * Load API key configuration from localStorage (decrypted)
 * Handles both old format (version 1) and new format (version 2 with metadata)
 * Automatically checks for expiration
 *
 * @returns The decrypted API key configuration, or null if not found or expired
 *
 * @example
 * ```tsx
 * const config = await loadApiKeyConfig()
 * if (config) {
 *   // Use the configuration
 * }
 * ```
 */
export async function loadApiKeyConfig(): Promise<ApiKeyConfig | null> {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.API_KEY_CONFIG);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    let encryptedConfig: ApiKeyConfig;
    let expiresAt: number | undefined;

    if (parsed.version === 2) {
      const metadata = parsed as ApiKeyConfigWithMetadata;
      encryptedConfig = metadata.config;
      expiresAt = metadata.expiresAt;

      if (expiresAt && Date.now() > expiresAt) {
        console.warn("API key configuration has expired");
        clearApiKeyConfig();
        return null;
      }
    } else {
      encryptedConfig = parsed as ApiKeyConfig;
    }

    return {
      type: encryptedConfig.type,
      ...(encryptedConfig.type === "oidc"
        ? {}
        : encryptedConfig.type === "gateway"
          ? {
              gatewayKey: encryptedConfig.gatewayKey
                ? await decryptKey(encryptedConfig.gatewayKey)
                : undefined,
            }
          : {
              providerKeys: encryptedConfig.providerKeys
                ? {
                    openai: encryptedConfig.providerKeys.openai
                      ? await decryptKey(encryptedConfig.providerKeys.openai)
                      : undefined,
                    anthropic: encryptedConfig.providerKeys.anthropic
                      ? await decryptKey(encryptedConfig.providerKeys.anthropic)
                      : undefined,
                    xai: encryptedConfig.providerKeys.xai
                      ? await decryptKey(encryptedConfig.providerKeys.xai)
                      : undefined,
                    google: encryptedConfig.providerKeys.google
                      ? await decryptKey(encryptedConfig.providerKeys.google)
                      : undefined,
                    mistral: encryptedConfig.providerKeys.mistral
                      ? await decryptKey(encryptedConfig.providerKeys.mistral)
                      : undefined,
                    deepseek: encryptedConfig.providerKeys.deepseek
                      ? await decryptKey(encryptedConfig.providerKeys.deepseek)
                      : undefined,
                    groq: encryptedConfig.providerKeys.groq
                      ? await decryptKey(encryptedConfig.providerKeys.groq)
                      : undefined,
                  }
                : undefined,
            }),
    };
  } catch (error) {
    console.error("Failed to load API key config:", error);
    return null;
  }
}

/**
 * Get the primary API key (gateway key or first provider key)
 * Returns the key that should be used for API requests
 *
 * @returns Promise resolving to the primary API key string, or null if no key is configured
 *
 * @example
 * ```tsx
 * const apiKey = await getPrimaryApiKey()
 * if (apiKey) {
 *   // Use the key for API requests
 * }
 * ```
 */
export async function getPrimaryApiKey(): Promise<string | null> {
  const config = await loadApiKeyConfig();
  if (!config) return null;

  if (config.type === "oidc") {
    return null;
  }

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
    console.error("Failed to clear API key config:", error);
  }
}

/**
 * Default app settings used when no saved settings exist
 */
const DEFAULT_SETTINGS: AppSettings = {
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
 * console.log(settings.debugMode) // true or false
 * ```
 */
export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to load settings:", error);
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
 * saveSettings({ debugMode: true })
 * ```
 */
export function saveSettings(settings: Partial<AppSettings>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save settings:", error);
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
