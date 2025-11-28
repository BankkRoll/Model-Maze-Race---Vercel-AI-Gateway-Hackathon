/**
 * Maze generation and manipulation utilities
 * Uses recursive backtracking algorithm for maze generation
 *
 * @module maze
 */

import type {
  CellType,
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

  const start: Position = { x: 1, y: 1 };
  maze[start.y][start.x] = "start";

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
 * Get unvisited neighbors for maze generation (2 cells away to leave walls)
 * Used by the recursive backtracking algorithm
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
 * Removes some walls to create alternative routes
 *
 * @param maze - The maze grid to modify
 * @param difficulty - Difficulty level determining path density
 */
function addComplexity(
  maze: MazeGrid,
  difficulty: MazeConfig["difficulty"],
): void {
  const extraPaths = {
    easy: 0.1,
    medium: 0.05,
    hard: 0.02,
    expert: 0.01,
  }[difficulty];

  const height = maze.length;
  const width = maze[0].length;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (maze[y][x] === "wall" && Math.random() < extraPaths) {
        const neighbors = [
          maze[y - 1]?.[x],
          maze[y + 1]?.[x],
          maze[y]?.[x - 1],
          maze[y]?.[x + 1],
        ].filter(
          (cell) => cell === "path" || cell === "start" || cell === "exit",
        );

        if (neighbors.length >= 2) {
          maze[y][x] = "path";
        }
      }
    }
  }
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
 * Format the visible area as a string for the AI prompt
 * Converts the grid to a human-readable format with symbols
 *
 * @param visible - The visible area to format
 * @returns Formatted string representation of the visible area
 *
 * @example
 * ```tsx
 * const formatted = formatVisibleAreaForPrompt(visibleArea)
 * // Returns: "█ · █\n· S ·\n█ · E"
 * ```
 */
export function formatVisibleAreaForPrompt(visible: VisibleArea): string {
  const symbols = {
    wall: "█",
    path: "·",
    start: "S",
    exit: "E",
    null: "?",
  };

  const lines = visible.grid.map((row) =>
    row.map((cell) => symbols[cell ?? "null"]).join(" "),
  );

  return lines.join("\n");
}
