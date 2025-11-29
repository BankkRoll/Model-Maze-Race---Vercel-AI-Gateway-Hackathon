"use client";

/**
 * Setup stage component for race configuration
 * Manages its own state and handles race initialization
 *
 * @module SetupStage
 */

import { HeroDemo } from "@/components/landing/hero-demo";
import { ModelSelector } from "@/components/landing/model-selector";
import { RacePreviewCard } from "@/components/landing/race-preview-card";
import { SettingsPanel } from "@/components/landing/settings-panel";
import { useApiKey } from "@/context/api-key-context";
import { useMaze } from "@/hooks/use-maze";
import { loadSettings } from "@/lib/storage";
import type { AvailableModel, MazeConfig, ModelConfig } from "@/types";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Setup stage component
 * Provides UI for configuring the maze and selecting AI models before starting a race
 *
 * @returns SetupStage JSX element
 */
export function SetupStage() {
  const router = useRouter();
  const { keyConfig, primaryKey, setKeyConfig } = useApiKey();
  const { createNewMaze } = useMaze();
  const [debugMode, setDebugMode] = useState(false);
  const [mazeConfig, setMazeConfig] = useState<MazeConfig>({
    width: 25,
    height: 25,
    difficulty: "medium",
  });
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [selectedModels, setSelectedModels] = useState<AvailableModel[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settings = loadSettings();
    setDebugMode(settings.debugMode);

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
  }, [setKeyConfig]);

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

  const hasApiKey = !!keyConfig && (keyConfig.type === "oidc" || !!primaryKey);

  return (
    <>
      {error && (
        <div className="container mx-auto px-4 pt-4">
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm">Authentication Error: {error}</p>
          </div>
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto py-12 text-center space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <span>Vercel AI Gateway Hackathon</span>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Autonomous Simulation Where Multiple AI Models Face Off
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto space-y-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Powered by AI Gateway</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>150+ AI Models Supported</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Automated Head-to-Head Comparisons</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <HeroDemo className="w-full" debugMode={debugMode} />
        </motion.div>

        {hasApiKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="inline-flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
              onClick={() => {
                document
                  .getElementById("setup-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="text-sm font-medium">Get Started</span>
              <motion.svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </motion.svg>
            </motion.div>
          </motion.div>
        )}
      </motion.section>

      <motion.div
        id="setup-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12 sm:pb-16 w-full px-2 sm:px-0"
      >
        <div className="text-center space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
            Setup Your Race
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
            Configure the maze, select AI models, and preview your racers before
            starting.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold text-primary">
                  1
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Step 1: Configure Maze
              </h3>
            </div>
            <SettingsPanel
              onConfigChange={setMazeConfig}
              onSpeedChange={setSpeedMultiplier}
              disabled={!hasApiKey}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold text-primary">
                  2
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Step 2: Select Models
              </h3>
            </div>
            <ModelSelector
              onModelsSelected={handleModelsSelected}
              onSelectionChange={setSelectedModels}
              disabled={!hasApiKey}
              apiKey={primaryKey}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold text-primary">
                  3
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Step 3: Preview & Start
              </h3>
            </div>
            <RacePreviewCard
              selectedModels={selectedModels}
              onStart={handleModelsSelected}
              disabled={!hasApiKey}
            />
          </motion.div>
        </div>

        {!hasApiKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-chart-3/10 border border-chart-3/30 rounded-lg text-center"
          >
            <p className="text-sm text-chart-3">
              Please add an API key to start racing
            </p>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
