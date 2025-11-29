"use client";

/**
 * Context provider for API key management
 * Handles loading/saving API key configuration from localStorage
 *
 * @module ApiKeyContext
 */

import {
  clearApiKeyConfig,
  getPrimaryApiKey,
  loadApiKeyConfig,
  saveApiKeyConfig,
} from "@/lib/storage";
import type { ApiKeyConfig } from "@/types";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Type definition for the API key context value
 *
 * @interface ApiKeyContextType
 */
interface ApiKeyContextType {
  /** Current API key configuration, or null if not set */
  keyConfig: ApiKeyConfig | null;
  /** Primary API key string (gateway key or first provider key), or null if not set */
  primaryKey: string | null;
  /** Function to set and save a new API key configuration */
  setKeyConfig: (config: ApiKeyConfig, expiresInDays?: number) => Promise<void>;
  /** Function to clear the stored API key configuration */
  clearKey: () => void;
  /** Whether the context is still loading the initial configuration */
  isLoading: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

/**
 * Provider component for API key context
 * Manages API key configuration state and persistence
 *
 * @param props - Component props
 * @param props.children - React children to wrap with the provider
 * @returns The provider component
 *
 * @example
 * ```tsx
 * <ApiKeyProvider>
 *   <App />
 * </ApiKeyProvider>
 * ```
 */
export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [keyConfig, setKeyConfigState] = useState<ApiKeyConfig | null>(null);
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      const config = await loadApiKeyConfig();
      const primary = await getPrimaryApiKey();
      setKeyConfigState(config);
      setPrimaryKey(primary);
      setIsLoading(false);
    }
    loadConfig();
  }, []);

  /**
   * Sets and saves a new API key configuration
   * Updates both the context state and localStorage
   * For OIDC type, checks for access token in cookies
   *
   * @param config - The API key configuration to save
   * @param expiresInDays - Optional number of days until key expires
   * @returns Promise that resolves when save is complete
   */
  const setKeyConfig = async (
    config: ApiKeyConfig,
    expiresInDays?: number,
  ): Promise<void> => {
    await saveApiKeyConfig(config, expiresInDays);
    setKeyConfigState(config);

    if (config.type === "oidc") {
      /**
       * For OIDC, primaryKey is null - Gateway will use OIDC automatically when deployed.
       * In local dev, user should use Gateway API key instead.
       */
      setPrimaryKey(null);
    } else if (config.type === "gateway" && config.gatewayKey) {
      setPrimaryKey(config.gatewayKey);
    } else if (config.type === "provider" && config.providerKeys) {
      const firstKey =
        config.providerKeys.openai ||
        config.providerKeys.anthropic ||
        config.providerKeys.xai ||
        config.providerKeys.google ||
        config.providerKeys.mistral ||
        config.providerKeys.deepseek ||
        config.providerKeys.groq ||
        null;
      setPrimaryKey(firstKey);
    }
  };

  /**
   * Clears the stored API key configuration
   * Removes both context state and localStorage data
   */
  const clearKey = () => {
    clearApiKeyConfig();
    setKeyConfigState(null);
    setPrimaryKey(null);
  };

  return (
    <ApiKeyContext.Provider
      value={{ keyConfig, primaryKey, setKeyConfig, clearKey, isLoading }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

/**
 * Hook to access the API key context
 * Must be used within an ApiKeyProvider component
 *
 * @returns The API key context value
 * @throws {Error} If used outside of ApiKeyProvider
 *
 * @example
 * ```tsx
 * const { keyConfig, primaryKey, setKeyConfig, clearKey, isLoading } = useApiKey()
 * ```
 */
export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error("useApiKey must be used within ApiKeyProvider");
  }
  return context;
}
