/**
 * Custom hook for hero demo maze generation and initialization
 *
 * @module UseHeroMaze
 */

import { findAllPaths, generateMaze } from "@/lib/maze";
import { getHeroPathfindingConfig } from "@/lib/pathfinding-config";
import type { MazeGrid, ModelConfig, ModelState, Position } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseHeroMazeResult {
  demoMaze: MazeGrid | null;
  startPos: Position | null;
  exitPos: Position | null;
  demoModels: ModelState[];
  allPaths: Position[][];
  reachableCells: Set<string>;
  regenerateMaze: () => void;
}

/**
 * Hook for managing hero demo maze state
 *
 * @param debugMode - Whether debug mode is enabled
 * @returns Maze state and models
 */
export function useHeroMaze(debugMode: boolean): UseHeroMazeResult {
  const [demoMaze, setDemoMaze] = useState<MazeGrid | null>(null);
  const [startPos, setStartPos] = useState<Position | null>(null);
  const [exitPos, setExitPos] = useState<Position | null>(null);
  const [demoModels, setDemoModels] = useState<ModelState[]>([]);
  const [regenerateKey, setRegenerateKey] = useState(0);

  const allPaths = useMemo(() => {
    if (!debugMode || !demoMaze || !startPos || !exitPos) return [];
    try {
      const config = getHeroPathfindingConfig();
      return findAllPaths(
        demoMaze,
        startPos,
        exitPos,
        config.maxPaths,
        config.maxPathLength,
        config.maxRevisits,
        config.similarityThreshold,
        config.maxPathsToTry,
      );
    } catch {
      return [];
    }
  }, [debugMode, demoMaze, startPos, exitPos]);

  const reachableCells = useMemo(() => {
    if (!debugMode || allPaths.length === 0) return new Set<string>();
    const cells = new Set<string>();
    for (const path of allPaths) {
      for (const pos of path) {
        cells.add(`${pos.x},${pos.y}`);
      }
    }
    return cells;
  }, [debugMode, allPaths]);

  /**
   * Find a path from start to exit using BFS (cardinal directions only)
   * Returns the path as an array of positions, or null if no path exists
   */
  const findPathBFS = (
    maze: MazeGrid,
    start: Position,
    exit: Position,
  ): Position[] | null => {
    const queue: { pos: Position; path: Position[] }[] = [
      { pos: start, path: [start] },
    ];
    const visited = new Set<string>([`${start.x},${start.y}`]);
    const width = maze[0].length;
    const height = maze.length;

    const cardinalDirections = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.pos.x === exit.x && current.pos.y === exit.y) {
        return current.path;
      }

      for (const dir of cardinalDirections) {
        const next: Position = {
          x: current.pos.x + dir.x,
          y: current.pos.y + dir.y,
        };

        const key = `${next.x},${next.y}`;

        if (
          next.x >= 0 &&
          next.x < width &&
          next.y >= 0 &&
          next.y < height &&
          !visited.has(key) &&
          (maze[next.y][next.x] === "path" ||
            maze[next.y][next.x] === "start" ||
            maze[next.y][next.x] === "exit")
        ) {
          visited.add(key);
          queue.push({
            pos: next,
            path: [...current.path, next],
          });
        }
      }
    }

    return null;
  };

  /**
   * Carve a path into the maze, ensuring only cardinal directions and 1-cell width
   */
  const carvePath = (maze: MazeGrid, path: Position[]): void => {
    for (const pos of path) {
      if (maze[pos.y][pos.x] !== "start" && maze[pos.y][pos.x] !== "exit") {
        maze[pos.y][pos.x] = "path";
      }
    }
  };

  const generateMazeData = () => {
    const width = 20;
    const height = 20;
    const edgeStart: Position = { x: 0, y: 0 };
    const edgeExit: Position = { x: width - 1, y: height - 1 };

    let maze: MazeGrid | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (attempts < MAX_ATTEMPTS && !maze) {
      const generated = generateMaze({
        width,
        height,
        difficulty: "medium",
      });

      const workingMaze = generated.maze.map((row) => [...row]);

      workingMaze[edgeStart.y][edgeStart.x] = "start";
      workingMaze[edgeExit.y][edgeExit.x] = "exit";

      workingMaze[0][1] = "path";
      workingMaze[1][0] = "path";
      workingMaze[1][1] = "path";

      workingMaze[height - 1][width - 2] = "path";
      workingMaze[height - 2][width - 1] = "path";

      const path = findPathBFS(workingMaze, edgeStart, edgeExit);

      if (path && path.length > 0) {
        carvePath(workingMaze, path);

        const validationPath = findPathBFS(workingMaze, edgeStart, edgeExit);
        if (validationPath && validationPath.length > 0) {
          const pathExists = findAllPaths(
            workingMaze,
            edgeStart,
            edgeExit,
            1,
            undefined,
            1,
            0.95,
            500,
          );
          if (pathExists.length > 0) {
            maze = workingMaze;
            break;
          }
        }
      }

      attempts++;
    }

    if (!maze) {
      const fallback = generateMaze({
        width,
        height,
        difficulty: "easy",
      });
      maze = fallback.maze.map((row) => [...row]);

      maze[edgeStart.y][edgeStart.x] = "start";
      maze[edgeExit.y][edgeExit.x] = "exit";

      maze[0][1] = "path";
      maze[1][0] = "path";
      maze[1][1] = "path";

      maze[height - 1][width - 2] = "path";
      maze[height - 2][width - 1] = "path";

      const fallbackPath = findPathBFS(maze, edgeStart, edgeExit);
      if (fallbackPath && fallbackPath.length > 0) {
        carvePath(maze, fallbackPath);
      } else {
        const simplePath: Position[] = [];
        for (let x = 0; x < width; x++) {
          simplePath.push({ x, y: 0 });
        }
        for (let y = 1; y < height; y++) {
          simplePath.push({ x: width - 1, y });
        }
        carvePath(maze, simplePath);
      }
    }

    if (!maze) {
      return;
    }

    setDemoMaze(maze);
    setStartPos(edgeStart);
    setExitPos(edgeExit);

    const demoModelConfigs: ModelConfig[] = [
      {
        id: "demo-1",
        name: "GPT-4o",
        color: "#06b6d4",
        modelString: "openai/gpt-4o",
      },
      {
        id: "demo-2",
        name: "Claude",
        color: "#f59e0b",
        modelString: "anthropic/claude",
      },
      {
        id: "demo-3",
        name: "Gemini",
        color: "#10b981",
        modelString: "google/gemini",
      },
      {
        id: "demo-4",
        name: "Llama",
        color: "#8b5cf6",
        modelString: "meta/llama",
      },
      {
        id: "demo-5",
        name: "Mistral",
        color: "#ec4899",
        modelString: "mistral/mistral",
      },
    ];

    const initialModels: ModelState[] = demoModelConfigs.map((config) => ({
      config,
      position: { ...edgeStart },
      moveHistory: [],
      status: "waiting" as const,
      stepCount: 0,
      totalTime: 0,
      lastMoveTime: 0,
      pathTaken: [{ ...edgeStart }],
    }));

    setDemoModels(initialModels);
  };

  useEffect(() => {
    generateMazeData();
  }, [regenerateKey]);

  const regenerateMaze = useCallback(() => {
    setRegenerateKey((prev) => prev + 1);
  }, []);

  return {
    demoMaze,
    startPos,
    exitPos,
    demoModels,
    allPaths,
    reachableCells,
    regenerateMaze,
  };
}
