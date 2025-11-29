/**
 * Maze generation and manipulation utilities
 * Uses recursive backtracking algorithm for maze generation
 *
 * @module maze
 */

import type {
  CellType,
  Direction,
  MazeConfig,
  MazeGrid,
  Position,
  VisibleArea,
} from "@/types";

/**
 * Generate a random maze using recursive backtracking algorithm
 * Ensures there's always a path from start to exit
 *
 * @param config - Maze generation configuration
 * @param config.width - Width of the maze in cells
 * @param config.height - Height of the maze in cells
 * @param config.difficulty - Difficulty level affecting maze complexity
 * @returns Object containing the generated maze grid, start position, and exit position
 *
 * @example
 * ```tsx
 * const { maze, start, exit } = generateMaze({
 *   width: 20,
 *   height: 20,
 *   difficulty: "medium"
 * })
 * ```
 */
export function generateMaze(config: MazeConfig): {
  maze: MazeGrid;
  start: Position;
  exit: Position;
} {
  const { width, height } = config;

  const maze: MazeGrid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "wall" as CellType),
  );

  /**
   * Start position is always at (1, 1)
   */
  const start: Position = { x: 1, y: 1 };
  maze[start.y][start.x] = "start";

  /**
   * Exit position is always at (width-2, height-2)
   */
  const exit: Position = { x: width - 2, y: height - 2 };
  maze[exit.y][exit.x] = "exit";

  const stack: Position[] = [start];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, width, height, visited);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];

    const betweenX = current.x + (next.x - current.x) / 2;
    const betweenY = current.y + (next.y - current.y) / 2;

    if (
      maze[Math.floor(betweenY)][Math.floor(betweenX)] !== "start" &&
      maze[Math.floor(betweenY)][Math.floor(betweenX)] !== "exit"
    ) {
      maze[Math.floor(betweenY)][Math.floor(betweenX)] = "path";
    }

    if (maze[next.y][next.x] !== "exit") {
      maze[next.y][next.x] = "path";
    }

    visited.add(`${next.x},${next.y}`);
    stack.push(next);
  }

  addComplexity(maze, config.difficulty);

  return { maze, start, exit };
}

/**
 * Get unvisited neighbors for maze generation
 * Checks positions 2 cells away to leave walls between paths.
 * Used by the recursive backtracking algorithm.
 *
 * @param pos - Current position
 * @param width - Maze width
 * @param height - Maze height
 * @param visited - Set of visited positions (as "x,y" strings)
 * @returns Array of unvisited neighbor positions
 */
function getUnvisitedNeighbors(
  pos: Position,
  width: number,
  height: number,
  visited: Set<string>,
): Position[] {
  const neighbors: Position[] = [];
  const directions = [
    { x: 0, y: -2 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
    { x: -2, y: 0 },
  ];

  for (const dir of directions) {
    const newX = pos.x + dir.x;
    const newY = pos.y + dir.y;

    if (
      newX > 0 &&
      newX < width - 1 &&
      newY > 0 &&
      newY < height - 1 &&
      !visited.has(`${newX},${newY}`)
    ) {
      neighbors.push({ x: newX, y: newY });
    }
  }

  return neighbors;
}

/**
 * Add additional paths based on difficulty to make maze more complex
 * Removes some walls to create alternative routes while maintaining proper maze structure
 * Ensures no 2-wide hallways are created
 *
 * @param maze - The maze grid to modify
 * @param difficulty - Difficulty level determining path density
 */
function addComplexity(
  maze: MazeGrid,
  difficulty: MazeConfig["difficulty"],
): void {
  const extraPaths = {
    easy: 0.08,
    medium: 0.04,
    hard: 0.015,
    expert: 0.005,
  }[difficulty];

  const height = maze.length;
  const width = maze[0].length;

  const considered = new Set<string>();

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (maze[y][x] !== "wall") continue;

      const key = `${x},${y}`;
      if (considered.has(key)) continue;

      const neighbors = [
        { x, y: y - 1, cell: maze[y - 1]?.[x] },
        { x, y: y + 1, cell: maze[y + 1]?.[x] },
        { x: x - 1, y, cell: maze[y]?.[x - 1] },
        { x: x + 1, y, cell: maze[y]?.[x + 1] },
      ];

      const pathNeighbors = neighbors.filter(
        (n) => n.cell === "path" || n.cell === "start" || n.cell === "exit",
      );

      if (pathNeighbors.length === 2) {
        const wouldCreateWideHallway = checkWouldCreateWideHallway(
          maze,
          x,
          y,
          pathNeighbors,
        );

        if (!wouldCreateWideHallway && Math.random() < extraPaths) {
          maze[y][x] = "path";
          considered.add(key);

          neighbors.forEach((n) => {
            if (maze[n.y]?.[n.x] === "wall") {
              considered.add(`${n.x},${n.y}`);
            }
          });
        }
      }
    }
  }
}

/**
 * Check if removing a wall would create a 2-wide hallway
 * A wide hallway is when you have 2+ adjacent path cells in a row/column
 *
 * @param maze - The maze grid
 * @param x - X coordinate of the wall
 * @param y - Y coordinate of the wall
 * @param pathNeighbors - Neighboring path cells
 * @returns True if removing this wall would create a wide hallway
 */
function checkWouldCreateWideHallway(
  maze: MazeGrid,
  x: number,
  y: number,
  pathNeighbors: Array<{ x: number; y: number; cell: CellType }>,
): boolean {
  const horizontalNeighbors = pathNeighbors.filter(
    (n) => n.y === y && (n.x === x - 1 || n.x === x + 1),
  );
  if (horizontalNeighbors.length === 2) {
    if (
      (maze[y - 1]?.[x] === "path" ||
        maze[y - 1]?.[x] === "start" ||
        maze[y - 1]?.[x] === "exit") &&
      (maze[y + 1]?.[x] === "path" ||
        maze[y + 1]?.[x] === "start" ||
        maze[y + 1]?.[x] === "exit")
    ) {
      return true;
    }
  }

  const verticalNeighbors = pathNeighbors.filter(
    (n) => n.x === x && (n.y === y - 1 || n.y === y + 1),
  );
  if (verticalNeighbors.length === 2) {
    if (
      (maze[y]?.[x - 1] === "path" ||
        maze[y]?.[x - 1] === "start" ||
        maze[y]?.[x - 1] === "exit") &&
      (maze[y]?.[x + 1] === "path" ||
        maze[y]?.[x + 1] === "start" ||
        maze[y]?.[x + 1] === "exit")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get the 3x3 visible area around a position (what the AI model sees)
 * Returns a grid showing the immediate surroundings, with null for out-of-bounds cells
 *
 * @param maze - The complete maze grid
 * @param position - Position to get the visible area around
 * @returns Visible area object with 3x3 grid and position
 *
 * @example
 * ```tsx
 * const visible = getVisibleArea(maze, { x: 5, y: 5 })
 * // Returns: { grid: [[...], [...], [...]], position: { x: 5, y: 5 } }
 * ```
 */
export function getVisibleArea(
  maze: MazeGrid,
  position: Position,
): VisibleArea {
  const grid: (CellType | null)[][] = Array.from({ length: 3 }, () =>
    Array(3).fill(null),
  );

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = position.x + dx;
      const y = position.y + dy;

      if (y >= 0 && y < maze.length && x >= 0 && x < maze[0].length) {
        grid[dy + 1][dx + 1] = maze[y][x];
      }
    }
  }

  return { grid, position };
}

/**
 * Check if a position is valid (not a wall and within bounds)
 *
 * @param maze - The maze grid
 * @param position - Position to validate
 * @returns True if the position is valid for movement, false otherwise
 *
 * @example
 * ```tsx
 * const isValid = isValidMove(maze, { x: 5, y: 5 })
 * if (isValid) {
 *   // Move is allowed
 * }
 * ```
 */
export function isValidMove(maze: MazeGrid, position: Position): boolean {
  if (
    position.y < 0 ||
    position.y >= maze.length ||
    position.x < 0 ||
    position.x >= maze[0].length
  ) {
    return false;
  }

  const cell = maze[position.y][position.x];
  return cell !== "wall";
}

/**
 * Calculate the optimal path length using BFS (Breadth-First Search)
 * Used for efficiency calculations to compare model performance
 *
 * @param maze - The maze grid
 * @param start - Starting position
 * @param exit - Exit position
 * @returns The shortest path length in steps, or -1 if no path exists
 *
 * @example
 * ```tsx
 * const optimalSteps = calculateOptimalPath(maze, startPos, exitPos)
 * const efficiency = (optimalSteps / actualSteps) * 100
 * ```
 */
export function calculateOptimalPath(
  maze: MazeGrid,
  start: Position,
  exit: Position,
): number {
  const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.pos.x === exit.x && current.pos.y === exit.y) {
      return current.dist;
    }

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const next = {
        x: current.pos.x + dir.x,
        y: current.pos.y + dir.y,
      };

      const key = `${next.x},${next.y}`;
      if (!visited.has(key) && isValidMove(maze, next)) {
        visited.add(key);
        queue.push({ pos: next, dist: current.dist + 1 });
      }
    }
  }

  return -1;
}

/**
 * Check if a path is significantly different from existing paths using Jaccard similarity
 *
 * @param newPath - Path to check
 * @param existingPaths - Array of existing paths
 * @param similarityThreshold - Maximum similarity threshold (default: 0.85)
 * @returns True if path is significantly different
 */
function isPathSignificantlyDifferent(
  newPath: Position[],
  existingPaths: Position[][],
  similarityThreshold: number = 0.85,
): boolean {
  if (existingPaths.length === 0) return true;

  const pathsToCheck = existingPaths.slice(0, 20);
  const newPathSet = new Set(newPath.map((p) => `${p.x},${p.y}`));

  for (const existingPath of pathsToCheck) {
    const lengthDiff = Math.abs(newPath.length - existingPath.length);
    const avgLength = (newPath.length + existingPath.length) / 2;

    if (avgLength > 0 && lengthDiff / avgLength < 0.15) {
      const existingPathSet = new Set(existingPath.map((p) => `${p.x},${p.y}`));
      let intersection = 0;

      for (const key of newPathSet) {
        if (existingPathSet.has(key)) intersection++;
      }

      const union = newPathSet.size + existingPathSet.size - intersection;
      const similarity = union === 0 ? 0 : intersection / union;

      if (similarity >= similarityThreshold) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Find significantly different paths from start to exit using DFS with backtracking
 *
 * @param maze - The maze grid
 * @param start - Starting position
 * @param exit - Exit position
 * @param maxPaths - Maximum number of unique paths to find (default: 50)
 * @param maxPathLength - Maximum path length to consider
 * @param maxRevisits - Maximum times a cell can be revisited (default: 2)
 * @param similarityThreshold - Maximum similarity threshold (default: 0.85)
 * @returns Array of significantly different paths, sorted by length
 */
export function findAllPaths(
  maze: MazeGrid,
  start: Position,
  exit: Position,
  maxPaths: number = 50,
  maxPathLength?: number,
  maxRevisits: number = 2,
  similarityThreshold: number = 0.85,
): Position[][] {
  const allPaths: Position[][] = [];
  const width = maze[0]?.length || 0;
  const height = maze.length;
  const defaultMaxLength = maxPathLength || Math.min(width * height * 2, 1000);
  const exactPathSet = new Set<string>();
  let pathsTried = 0;
  const MAX_PATHS_TO_TRY = 5000;

  function dfs(
    current: Position,
    path: Position[],
    visitCounts: Map<string, number>,
  ): void {
    if (
      pathsTried >= MAX_PATHS_TO_TRY ||
      allPaths.length >= maxPaths ||
      path.length > defaultMaxLength
    ) {
      return;
    }

    if (current.x === exit.x && current.y === exit.y) {
      pathsTried++;
      const pathKey = path.map((p) => `${p.x},${p.y}`).join("|");

      if (
        !exactPathSet.has(pathKey) &&
        isPathSignificantlyDifferent(path, allPaths, similarityThreshold)
      ) {
        exactPathSet.add(pathKey);
        allPaths.push([...path]);
      }
      return;
    }

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const next: Position = { x: current.x + dir.x, y: current.y + dir.y };

      if (isValidMove(maze, next)) {
        const nextKey = `${next.x},${next.y}`;
        const visitCount = visitCounts.get(nextKey) || 0;

        if (visitCount < maxRevisits) {
          if (visitCount > 0 && path.length >= 2) {
            const prevPos = path[path.length - 2];
            if (prevPos.x === next.x && prevPos.y === next.y) {
              continue;
            }
          }

          visitCounts.set(nextKey, visitCount + 1);
          path.push(next);
          dfs(next, path, visitCounts);
          path.pop();

          if (visitCount === 0) {
            visitCounts.delete(nextKey);
          } else {
            visitCounts.set(nextKey, visitCount);
          }
        }
      }
    }
  }

  const visitCounts = new Map<string, number>();
  visitCounts.set(`${start.x},${start.y}`, 1);
  dfs(start, [start], visitCounts);

  allPaths.sort((a, b) => a.length - b.length);
  return allPaths;
}

/**
 * Get all cells that appear in any path from start to exit
 * Useful for highlighting all reachable cells in debug mode
 * Uses BFS to find ALL reachable cells, not just those in found paths
 *
 * @param maze - The maze grid
 * @param start - Starting position
 * @param exit - Exit position
 * @param maxPaths - Maximum number of paths to consider (default: 200)
 * @returns Set of position keys (as "x,y" strings) that appear in any path
 *
 * @example
 * ```tsx
 * const reachableCells = getAllReachableCells(maze, startPos, exitPos)
 * // Returns: Set(["1,1", "1,2", "2,2", ...])
 * ```
 */
export function getAllReachableCells(
  maze: MazeGrid,
  start: Position,
  exit: Position,
  maxPaths: number = 200,
): Set<string> {
  const allPaths = findAllPaths(maze, start, exit, maxPaths);
  const reachableCells = new Set<string>();

  for (const path of allPaths) {
    for (const pos of path) {
      reachableCells.add(`${pos.x},${pos.y}`);
    }
  }

  const queue: Position[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    reachableCells.add(`${current.x},${current.y}`);

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const next: Position = {
        x: current.x + dir.x,
        y: current.y + dir.y,
      };

      const key = `${next.x},${next.y}`;
      if (!visited.has(key) && isValidMove(maze, next)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  return reachableCells;
}

/**
 * Count how many times a position has been visited
 *
 * @param pathTaken - Array of all positions visited
 * @param position - Position to count visits for
 * @returns Number of times the position was visited
 */
export function countVisits(pathTaken: Position[], position: Position): number {
  return pathTaken.filter((p) => p.x === position.x && p.y === position.y)
    .length;
}

/**
 * Detect if there's a repeating loop pattern in recent moves
 * Checks for patterns like left-right-left-right or up-down-up-down
 *
 * @param moveHistory - Array of move directions
 * @param window - Number of recent moves to check (default: 6)
 * @returns True if a loop pattern is detected
 */
export function detectLoop(
  moveHistory: Direction[],
  window: number = 6,
): boolean {
  if (moveHistory.length < 4) return false;

  const recent = moveHistory.slice(-window);
  if (recent.length < 4) return false;

  for (let i = 0; i <= recent.length - 4; i++) {
    const pattern = recent.slice(i, i + 4);
    if (
      pattern[0] === pattern[2] &&
      pattern[1] === pattern[3] &&
      pattern[0] !== pattern[1]
    ) {
      return true;
    }
  }

  if (recent.length >= 6) {
    for (let i = 0; i <= recent.length - 6; i++) {
      const pattern = recent.slice(i, i + 6);
      if (
        pattern[0] === pattern[3] &&
        pattern[1] === pattern[4] &&
        pattern[2] === pattern[5]
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get unexplored directions from current position
 * Checks which directions lead to unvisited positions
 *
 * @param current - Current position
 * @param pathTaken - Array of all positions visited
 * @param visible - Visible area around current position
 * @returns Array of unexplored directions
 */
export function getUnexploredDirections(
  current: Position,
  pathTaken: Position[],
  visible: VisibleArea,
): Direction[] {
  const unexplored: Direction[] = [];
  const directions: { dir: Direction; offset: { x: number; y: number } }[] = [
    { dir: "up", offset: { x: 0, y: -1 } },
    { dir: "down", offset: { x: 0, y: 1 } },
    { dir: "left", offset: { x: -1, y: 0 } },
    { dir: "right", offset: { x: 1, y: 0 } },
  ];

  for (const { dir, offset } of directions) {
    const nextPos = {
      x: current.x + offset.x,
      y: current.y + offset.y,
    };

    const visibleX = offset.x + 1;
    const visibleY = offset.y + 1;
    if (
      visibleY >= 0 &&
      visibleY < 3 &&
      visibleX >= 0 &&
      visibleX < 3 &&
      visible.grid[visibleY][visibleX] !== "wall" &&
      visible.grid[visibleY][visibleX] !== null
    ) {
      const visited = pathTaken.some(
        (p) => p.x === nextPos.x && p.y === nextPos.y,
      );
      if (!visited) {
        unexplored.push(dir);
      }
    }
  }

  return unexplored;
}

/**
 * Format the visible area as a string for the AI prompt
 * Marks visited positions with 'V' symbol
 *
 * @param visible - The visible area to format
 * @param pathTaken - Optional array of visited positions to mark
 * @param currentPosition - Current position of the model
 * @returns Formatted string representation of the visible area
 *
 * @example
 * ```tsx
 * const formatted = formatVisibleAreaForPrompt(visibleArea, pathTaken, currentPos)
 * // Returns: "█ · █\nV █ ·\n? · E" (V = visited)
 * ```
 */
export function formatVisibleAreaForPrompt(
  visible: VisibleArea,
  pathTaken?: Position[],
  currentPosition?: Position,
): string {
  const symbols = {
    wall: "█",
    path: "·",
    start: "S",
    exit: "E",
    null: "?",
  };

  const lines = visible.grid.map((row, rowIdx) =>
    row
      .map((cell, colIdx) => {
        if (cell === "wall" || cell === null) {
          return symbols[cell ?? "null"];
        }

        if (currentPosition) {
          const actualX = currentPosition.x + (colIdx - 1);
          const actualY = currentPosition.y + (rowIdx - 1);
          const actualPos: Position = { x: actualX, y: actualY };

          if (
            pathTaken &&
            !(
              actualPos.x === currentPosition.x &&
              actualPos.y === currentPosition.y
            )
          ) {
            const visitCount = countVisits(pathTaken, actualPos);
            if (visitCount > 0) {
              return visitCount > 1 ? `V${visitCount}` : "V";
            }
          }
        }

        return symbols[cell];
      })
      .join(" "),
  );

  return lines.join("\n");
}
