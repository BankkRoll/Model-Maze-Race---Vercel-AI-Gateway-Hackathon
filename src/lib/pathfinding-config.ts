/**
 * Pathfinding configuration based on difficulty and use case
 *
 * @module pathfinding-config
 */

import type { MazeConfig } from "@/types";

export interface PathfindingConfig {
  maxPaths: number;
  maxPathLength?: number;
  maxRevisits: number;
  similarityThreshold: number;
  maxPathsToTry: number;
}

const PATHFINDING_PRESETS: Record<
  "minimal" | "light" | "medium" | "heavy" | "extensive",
  PathfindingConfig
> = {
  minimal: {
    maxPaths: 1,
    maxRevisits: 1,
    similarityThreshold: 0.95,
    maxPathsToTry: 100,
  },
  light: {
    maxPaths: 5,
    maxRevisits: 2,
    similarityThreshold: 0.9,
    maxPathsToTry: 1000,
  },
  medium: {
    maxPaths: 10,
    maxRevisits: 2,
    similarityThreshold: 0.85,
    maxPathsToTry: 2500,
  },
  heavy: {
    maxPaths: 30,
    maxRevisits: 2,
    similarityThreshold: 0.85,
    maxPathsToTry: 5000,
  },
  extensive: {
    maxPaths: 50,
    maxRevisits: 3,
    similarityThreshold: 0.8,
    maxPathsToTry: 10000,
  },
};

export function getPathfindingConfig(
  difficulty: MazeConfig["difficulty"],
  preset: "minimal" | "light" | "medium" | "heavy" | "extensive" = "medium",
): PathfindingConfig {
  const baseConfig = PATHFINDING_PRESETS[preset];

  const difficultyMultipliers = {
    easy: { maxPaths: 1.5, maxPathsToTry: 1.2 },
    medium: { maxPaths: 1.0, maxPathsToTry: 1.0 },
    hard: { maxPaths: 0.8, maxPathsToTry: 0.9 },
    expert: { maxPaths: 0.6, maxPathsToTry: 0.8 },
  };

  const multiplier = difficultyMultipliers[difficulty];

  return {
    ...baseConfig,
    maxPaths: Math.max(
      1,
      Math.floor(baseConfig.maxPaths * multiplier.maxPaths),
    ),
    maxPathsToTry: Math.floor(
      baseConfig.maxPathsToTry * multiplier.maxPathsToTry,
    ),
  };
}

export function getHeroPathfindingConfig(): PathfindingConfig {
  return PATHFINDING_PRESETS.light;
}

export function getGamePathfindingConfig(
  difficulty: MazeConfig["difficulty"],
): PathfindingConfig {
  return getPathfindingConfig(difficulty, "medium");
}
