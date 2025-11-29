"use client";

/**
 * Main application page - Model Maze Race Landing/Setup
 * Handles configuration and navigation to game page
 *
 * @module HomePage
 */

import { SetupStage } from "@/components/landing/setup-stage";
import { ApiKeyModal } from "@/components/shared/api-key-modal";
import { Header } from "@/components/shared/header";
import { useApiKey } from "@/context/api-key-context";
import { useMaze } from "@/hooks/use-maze";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { ApiKeyConfig, MazeConfig, ModelConfig } from "@/types";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Main application page component
 * Manages application state, orchestrates game stages, and coordinates all components
 *
 * @returns HomePage JSX element
 *
 * @example
 * ```tsx
 * // This is the root page component, typically used in Next.js routing
 * export default HomePage
 * ```
 */
export default function HomePage() {
  const router = useRouter();
  const {
    keyConfig,
    primaryKey,
    setKeyConfig,
    isLoading: apiKeyLoading,
  } = useApiKey();
  const [showApiModal, setShowApiModal] = useState(false);
  const hasCheckedApiKey = useRef(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showFullMaze, setShowFullMaze] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mazeConfig, setMazeConfig] = useState<MazeConfig>({
    width: 25,
    height: 25,
    difficulty: "medium",
  });
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const { createNewMaze } = useMaze();

  useEffect(() => {
    const settings = loadSettings();
    setDebugMode(settings.debugMode);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get("auth_success");
    const authError = urlParams.get("auth_error");

    if (authSuccess) {
      setKeyConfig({ type: "oidc" });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (authError) {
      setError(authError);
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (!apiKeyLoading && !hasCheckedApiKey.current) {
      hasCheckedApiKey.current = true;
      if (!keyConfig || (keyConfig.type !== "oidc" && !primaryKey)) {
        setShowApiModal(true);
      }
    }
  }, [apiKeyLoading, primaryKey, keyConfig, setKeyConfig]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  /**
   * Toggle debug mode on/off
   * Updates state and saves preference to localStorage
   */
  const toggleDebugMode = () => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    saveSettings({ debugMode: newDebugMode });
  };

  /**
   * Handle API key submission from modal
   * Saves the key configuration and closes the modal
   *
   * @param config - API key configuration object
   */
  const handleApiKeySubmit = async (config: ApiKeyConfig) => {
    await setKeyConfig(config);
    setShowApiModal(false);
  };

  /**
   * Handle model selection and navigate to game page
   * Saves configuration and navigates to /game
   *
   * @param configs - Array of selected model configurations
   */
  const handleModelsSelected = (configs: ModelConfig[]) => {
    const { maze: newMaze, start, exit } = createNewMaze(mazeConfig);

    localStorage.setItem(
      "gameConfig",
      JSON.stringify({
        mazeConfig,
        speedMultiplier,
        selectedModels: configs,
        maze: newMaze,
        startPos: start,
        exitPos: exit,
      }),
    );

    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        theme={(theme as "light" | "dark") || "dark"}
        debugMode={debugMode}
        hasApiKey={!!keyConfig && (keyConfig.type === "oidc" || !!primaryKey)}
        onThemeToggle={toggleTheme}
        onDebugToggle={toggleDebugMode}
        onFullMazeToggle={setShowFullMaze}
        onApiKeyClick={() => setShowApiModal(true)}
      />

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm">Authentication Error: {error}</p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4">
        <SetupStage
          debugMode={debugMode}
          hasApiKey={!!keyConfig && (keyConfig.type === "oidc" || !!primaryKey)}
          mazeConfig={mazeConfig}
          speedMultiplier={speedMultiplier}
          onConfigChange={setMazeConfig}
          onSpeedChange={setSpeedMultiplier}
          onModelsSelected={handleModelsSelected}
          apiKey={primaryKey}
        />
      </main>

      <ApiKeyModal
        open={showApiModal}
        onSubmit={handleApiKeySubmit}
        required={!primaryKey}
        onClose={primaryKey ? () => setShowApiModal(false) : undefined}
      />
    </div>
  );
}
