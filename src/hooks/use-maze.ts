"use client";

/**
 * Custom hook for maze state management
 * Provides functions to create and reset mazes
 *
 * @module useMaze
 */

import { generateMaze } from "@/lib/maze";
import type { MazeConfig, MazeGrid, Position } from "@/types";
import { useCallback, useState } from "react";

/**
 * Hook for managing maze state
 *
 * @returns Object containing maze state and control functions
 * @returns {MazeGrid | null} maze - The current maze grid, or null if not created
 * @returns {Position | null} startPos - The starting position, or null if not created
 * @returns {Position | null} exitPos - The exit position, or null if not created
 * @returns {Function} createNewMaze - Function to generate a new maze
 * @returns {Function} resetMaze - Function to clear the current maze
 *
 * @example
 * ```tsx
 * const { maze, startPos, exitPos, createNewMaze, resetMaze } = useMaze()
 *
 * // Create a new maze
 * createNewMaze({ width: 20, height: 20, difficulty: "medium" })
 *
 * // Reset the maze
 * resetMaze()
 * ```
 */
export function useMaze() {
  const [maze, setMaze] = useState<MazeGrid | null>(null);
  const [startPos, setStartPos] = useState<Position | null>(null);
  const [exitPos, setExitPos] = useState<Position | null>(null);

  /**
   * Creates a new maze with the specified configuration
   *
   * @param config - Maze generation configuration
   * @param config.width - Width of the maze in cells
   * @param config.height - Height of the maze in cells
   * @param config.difficulty - Difficulty level affecting maze complexity
   * @returns The generated maze, start position, and exit position
   */
  const createNewMaze = useCallback((config: MazeConfig) => {
    const { maze: newMaze, start, exit } = generateMaze(config);
    setMaze(newMaze);
    setStartPos(start);
    setExitPos(exit);
    return { maze: newMaze, start, exit };
  }, []);

  /**
   * Resets the maze state, clearing all maze data
   */
  const resetMaze = useCallback(() => {
    setMaze(null);
    setStartPos(null);
    setExitPos(null);
  }, []);

  return {
    maze,
    startPos,
    exitPos,
    createNewMaze,
    resetMaze,
  };
}
