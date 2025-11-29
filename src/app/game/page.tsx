"use client";

/**
 * Game page - Runs the actual maze race
 * Loads configuration from localStorage and manages the race
 *
 * @module GamePage
 */

import { RunningStage } from "@/components/game/running-stage";
import { ApiKeyModal } from "@/components/shared/api-key-modal";
import { Header } from "@/components/shared/header";
import { useApiKey } from "@/context/api-key-context";
import { useModelRunner } from "@/hooks/use-model-runner";
import { generateMaze } from "@/lib/maze";
import {
  addRaceTime,
  incrementGamesPlayed,
  loadSettings,
  saveSettings,
} from "@/lib/storage";
import type { MazeConfig, MazeGrid, ModelConfig, Position } from "@/types";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function GamePage() {
  const router = useRouter();
  const {
    keyConfig,
    primaryKey,
    setKeyConfig,
    isLoading: apiKeyLoading,
  } = useApiKey();
  const [showApiModal, setShowApiModal] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  const [gameConfig, setGameConfig] = useState<{
    mazeConfig: MazeConfig;
    speedMultiplier: number;
    selectedModels: ModelConfig[];
    maze: MazeGrid;
    startPos: Position;
    exitPos: Position;
  } | null>(null);

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
    speedMultiplier: gameConfig?.speedMultiplier || 1,
    debugMode,
    apiKey: keyConfig?.type === "oidc" ? undefined : primaryKey || undefined,
  });

  useEffect(() => {
    const settings = loadSettings();
    setDebugMode(settings.debugMode);

    const stored = localStorage.getItem("gameConfig");
    if (!stored) {
      router.push("/");
      return;
    }

    try {
      const config = JSON.parse(stored);
      setGameConfig(config);
      initializeModels(config.selectedModels, config.startPos);
    } catch (err) {
      console.error("Failed to load game config:", err);
      router.push("/");
    }
  }, [router, initializeModels, setTheme]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "settings") {
        try {
          const newSettings = JSON.parse(e.newValue || "{}");
          if (typeof newSettings.debugMode === "boolean") {
            setDebugMode(newSettings.debugMode);
          }
        } catch {}
      }
    };

    const handleCustomStorageChange = () => {
      const settings = loadSettings();
      setDebugMode(settings.debugMode);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("settingsChanged", handleCustomStorageChange);

    const interval = setInterval(() => {
      const settings = loadSettings();
      if (settings.debugMode !== debugMode) {
        setDebugMode(settings.debugMode);
      }
    }, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("settingsChanged", handleCustomStorageChange);
      clearInterval(interval);
    };
  }, [debugMode]);

  useEffect(() => {
    if (!apiKeyLoading) {
      if (!keyConfig || (keyConfig.type !== "oidc" && !primaryKey)) {
        setShowApiModal(true);
      }
    }
  }, [apiKeyLoading, primaryKey, keyConfig]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const toggleDebugMode = () => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    saveSettings({ debugMode: newDebugMode });
  };

  const handleApiKeySubmit = async (config: any) => {
    await setKeyConfig(config);
    setShowApiModal(false);
  };

  const handleStartRace = async () => {
    if (!gameConfig?.maze || !gameConfig?.exitPos) return;

    const startTime = Date.now();
    await startRace(gameConfig.maze, gameConfig.exitPos);
    const raceTime = Date.now() - startTime;

    incrementGamesPlayed();
    addRaceTime(raceTime);
  };

  const handleReset = () => {
    stopRace();
    localStorage.removeItem("gameConfig");
    router.push("/");
  };

  const regenerateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRegenerateMaze = async () => {
    if (!gameConfig) return;

    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current);
      regenerateTimeoutRef.current = null;
    }

    stopRace();

    const { maze: newMaze, start, exit } = generateMaze(gameConfig.mazeConfig);

    const updatedConfig = {
      ...gameConfig,
      maze: newMaze,
      startPos: start,
      exitPos: exit,
    };

    localStorage.setItem("gameConfig", JSON.stringify(updatedConfig));
    setGameConfig(updatedConfig);

    initializeModels(updatedConfig.selectedModels, start);

    regenerateTimeoutRef.current = setTimeout(async () => {
      regenerateTimeoutRef.current = null;
      if (updatedConfig.maze && updatedConfig.exitPos) {
        const startTime = Date.now();
        await startRace(updatedConfig.maze, updatedConfig.exitPos);
        const raceTime = Date.now() - startTime;
        incrementGamesPlayed();
        addRaceTime(raceTime);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (regenerateTimeoutRef.current) {
        clearTimeout(regenerateTimeoutRef.current);
        regenerateTimeoutRef.current = null;
      }
      stopRace();
    };
  }, [stopRace]);

  if (!gameConfig) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm">Error: {error}</p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4">
        <RunningStage
          maze={gameConfig.maze}
          models={models}
          exitPos={gameConfig.exitPos}
          startPos={gameConfig.startPos}
          debugMode={debugMode}
          isRunning={isRunning}
          isPaused={isPaused}
          debugLogs={debugLogs}
          chatMessages={chatMessages}
          modelStatuses={modelStatuses}
          maxTurns={500}
          mazeConfig={gameConfig.mazeConfig}
          onStartRace={handleStartRace}
          onPauseRace={pauseRace}
          onResumeRace={resumeRace}
          onStopRace={stopRace}
          onReset={handleReset}
          onRegenerateMaze={handleRegenerateMaze}
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
