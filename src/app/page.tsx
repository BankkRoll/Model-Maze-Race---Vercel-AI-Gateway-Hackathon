"use client";

/**
 * Main application page - Model Maze Race
 * Orchestrates all components and manages game state
 *
 * @module HomePage
 */

import { ApiKeyModal } from "@/components/api-key-modal";
import { Header } from "@/components/header";
import { RunningStage } from "@/components/running-stage";
import { SetupStage } from "@/components/setup-stage";
import { useApiKey } from "@/context/api-key-context";
import { useMaze } from "@/hooks/use-maze";
import { useModelRunner } from "@/hooks/use-model-runner";
import {
  addRaceTime,
  incrementGamesPlayed,
  loadSettings,
  saveSettings,
} from "@/lib/storage";
import type { ApiKeyConfig, MazeConfig, ModelConfig } from "@/types";
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
  const { primaryKey, setKeyConfig, isLoading: apiKeyLoading } = useApiKey();
  const [showApiModal, setShowApiModal] = useState(false);
  const hasCheckedApiKey = useRef(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showFullMaze, setShowFullMaze] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [gameStage, setGameStage] = useState<"setup" | "running">("setup");
  const [mazeConfig, setMazeConfig] = useState<MazeConfig>({
    width: 25,
    height: 25,
    difficulty: "medium",
  });
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);

  const { maze, startPos, exitPos, createNewMaze } = useMaze();
  const {
    models,
    debugLogs,
    chatMessages,
    modelStatuses,
    isRunning,
    isPaused,
    initializeModels,
    startRace,
    pauseRace,
    resumeRace,
    stopRace,
  } = useModelRunner({
    maxTurns: 500,
    speedMultiplier,
    debugMode,
    apiKey: primaryKey,
  });

  /**
   * Load user settings from localStorage on component mount
   * Applies theme and debug mode preferences
   */
  useEffect(() => {
    const settings = loadSettings();
    setDebugMode(settings.debugMode);
    setTheme(settings.theme);

    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  /**
   * Check for API key on initial load
   * Only checks once after the API key context has finished loading
   */
  useEffect(() => {
    if (!apiKeyLoading && !hasCheckedApiKey.current) {
      hasCheckedApiKey.current = true;
      if (!primaryKey) {
        setShowApiModal(true);
      }
    }
  }, [apiKeyLoading, primaryKey]);

  /**
   * Toggle between light and dark theme
   * Updates state, saves to localStorage, and applies to document
   */
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    saveSettings({ theme: newTheme });

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
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
  const handleApiKeySubmit = (config: ApiKeyConfig) => {
    setKeyConfig(config);
    setShowApiModal(false);
  };

  /**
   * Handle model selection and race initialization
   * Generates a new maze and initializes selected models at the start position
   *
   * @param configs - Array of selected model configurations
   */
  const handleModelsSelected = (configs: ModelConfig[]) => {
    setSelectedModels(configs);

    const { maze: newMaze, start, exit } = createNewMaze(mazeConfig);

    initializeModels(configs, start);

    setGameStage("running");
  };

  /**
   * Start the race execution
   * Records race time and updates statistics
   */
  const handleStartRace = async () => {
    if (!maze || !exitPos) return;

    const startTime = Date.now();
    await startRace(maze, exitPos);
    const raceTime = Date.now() - startTime;

    incrementGamesPlayed();
    addRaceTime(raceTime);
  };

  /**
   * Reset the race and return to setup stage
   * Stops any running race and clears selected models
   */
  const handleReset = () => {
    stopRace();
    setGameStage("setup");
    setSelectedModels([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        theme={theme}
        debugMode={debugMode}
        showFullMazeToggle={gameStage === "running"}
        showFullMaze={showFullMaze}
        hasApiKey={!!primaryKey}
        onThemeToggle={toggleTheme}
        onDebugToggle={toggleDebugMode}
        onFullMazeToggle={setShowFullMaze}
        onApiKeyClick={() => setShowApiModal(true)}
      />

      <main className="container mx-auto px-4">
        {gameStage === "setup" ? (
          <SetupStage
            debugMode={debugMode}
            hasApiKey={!!primaryKey}
            mazeConfig={mazeConfig}
            speedMultiplier={speedMultiplier}
            onConfigChange={setMazeConfig}
            onSpeedChange={setSpeedMultiplier}
            onModelsSelected={handleModelsSelected}
            apiKey={primaryKey}
          />
        ) : (
          <RunningStage
            maze={maze}
            models={models}
            exitPos={exitPos}
            startPos={startPos}
            showFullMaze={showFullMaze}
            debugMode={debugMode}
            isRunning={isRunning}
            isPaused={isPaused}
            debugLogs={debugLogs}
            chatMessages={chatMessages}
            modelStatuses={modelStatuses}
            maxTurns={500}
            onStartRace={handleStartRace}
            onPauseRace={pauseRace}
            onResumeRace={resumeRace}
            onStopRace={stopRace}
            onReset={handleReset}
          />
        )}
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
