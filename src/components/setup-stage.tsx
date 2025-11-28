"use client";

/**
 * Setup stage component for race configuration
 * Displays hero section, demo, and configuration panels
 *
 * @module SetupStage
 */

import { HeroDemo } from "@/components/hero-demo";
import { ModelSelector } from "@/components/model-selector";
import { SettingsPanel } from "@/components/settings-panel";
import type { MazeConfig, ModelConfig } from "@/types";
import { motion } from "motion/react";

/**
 * Props for the SetupStage component
 *
 * @interface SetupStageProps
 */
interface SetupStageProps {
  /** Whether debug mode is enabled */
  debugMode: boolean;
  /** Whether an API key is configured */
  hasApiKey: boolean;
  /** Current maze configuration */
  mazeConfig: MazeConfig;
  /** Current speed multiplier */
  speedMultiplier: number;
  /** Callback when maze configuration changes */
  onConfigChange: (config: MazeConfig) => void;
  /** Callback when speed multiplier changes */
  onSpeedChange: (speed: number) => void;
  /** Callback when models are selected and race should start */
  onModelsSelected: (models: ModelConfig[]) => void;
  /** API key for model fetching */
  apiKey?: string | null;
}

/**
 * Setup stage component
 * Provides UI for configuring the maze and selecting AI models before starting a race
 *
 * @param props - SetupStage component props
 * @returns SetupStage JSX element
 *
 * @example
 * ```tsx
 * <SetupStage
 *   debugMode={false}
 *   hasApiKey={true}
 *   mazeConfig={{ width: 25, height: 25, difficulty: "medium" }}
 *   speedMultiplier={1}
 *   onConfigChange={(config) => setMazeConfig(config)}
 *   onSpeedChange={(speed) => setSpeedMultiplier(speed)}
 *   onModelsSelected={(models) => startRace(models)}
 *   apiKey="your-api-key"
 * />
 * ```
 */
export function SetupStage({
  debugMode,
  hasApiKey,
  mazeConfig,
  speedMultiplier,
  onConfigChange,
  onSpeedChange,
  onModelsSelected,
  apiKey,
}: SetupStageProps) {
  return (
    <>
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
            Configure the maze and select AI models to compete. Press Start to
            launch a round and watch the competition play out with a final
            ranked list based on performance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
          <div className="w-full min-w-0">
            <SettingsPanel
              onConfigChange={onConfigChange}
              onSpeedChange={onSpeedChange}
              disabled={!hasApiKey}
            />
          </div>

          <div className="w-full min-w-0">
            <ModelSelector
              onModelsSelected={onModelsSelected}
              disabled={!hasApiKey}
              apiKey={apiKey}
            />
          </div>
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
