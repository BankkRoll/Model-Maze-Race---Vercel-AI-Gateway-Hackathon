/**
 * Custom hook for hero demo maze generation and initialization
 *
 * @module UseHeroMaze
 */

import { findAllPaths, generateMaze } from "@/lib/maze";
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
      return findAllPaths(demoMaze, startPos, exitPos, 30, undefined, 2, 0.85);
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

  const generateMazeData = () => {
    const MAX_RETRIES = 10;
    let maze: MazeGrid | null = null;
    let edgeStart: Position | null = null;
    let edgeExit: Position | null = null;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      const generated = generateMaze({
        width: 20,
        height: 20,
        difficulty: "medium",
      });

      const width = generated.maze[0].length;
      const height = generated.maze.length;
      const lastRow = height - 1;
      const lastCol = width - 1;

      const start = generated.start;
      const exit = generated.exit;
      const tempStart: Position = { x: 0, y: 0 };

      if (start.x !== tempStart.x || start.y !== tempStart.y) {
        generated.maze[start.y][start.x] = "path";
      }
      generated.maze[tempStart.y][tempStart.x] = "start";

      const tempExit: Position = { x: lastCol, y: lastRow };
      if (exit.x !== tempExit.x || exit.y !== tempExit.y) {
        generated.maze[exit.y][exit.x] = "path";
      }
      generated.maze[tempExit.y][tempExit.x] = "exit";

      generated.maze[0][1] = "path";
      generated.maze[1][0] = "path";
      generated.maze[1][1] = "path";

      generated.maze[lastRow][lastCol - 1] = "path";
      generated.maze[lastRow - 1][lastCol] = "path";
      if (lastRow > 1 && lastCol > 1) {
        generated.maze[lastRow - 1][lastCol - 1] = "path";
      }

      let nearestPathX = lastCol - 1;
      let nearestPathY = lastRow - 1;
      let foundPath = false;

      for (let radius = 1; radius <= 3 && !foundPath; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const checkX = lastCol + dx;
            const checkY = lastRow + dy;
            if (
              checkX >= 0 &&
              checkX < width &&
              checkY >= 0 &&
              checkY < height &&
              (generated.maze[checkY]?.[checkX] === "path" ||
                generated.maze[checkY]?.[checkX] === "start")
            ) {
              nearestPathX = checkX;
              nearestPathY = checkY;
              foundPath = true;
              break;
            }
          }
          if (foundPath) break;
        }
      }

      let currentX = nearestPathX;
      let currentY = nearestPathY;

      while (currentX !== lastCol || currentY !== lastRow) {
        if (currentX < lastCol) {
          currentX++;
        } else if (currentY < lastRow) {
          currentY++;
        }
        if (currentX !== lastCol || currentY !== lastRow) {
          generated.maze[currentY][currentX] = "path";
        }
      }

      const pathExists = findAllPaths(generated.maze, tempStart, tempExit, 1);
      if (pathExists.length > 0) {
        maze = generated.maze;
        edgeStart = tempStart;
        edgeExit = tempExit;
        break;
      }

      attempts++;
      if (attempts >= MAX_RETRIES) {
        maze = generated.maze;
        edgeStart = tempStart;
        edgeExit = tempExit;
      }
    }

    if (!maze || !edgeStart || !edgeExit) {
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
