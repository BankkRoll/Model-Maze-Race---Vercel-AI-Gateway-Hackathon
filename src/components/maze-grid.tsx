"use client";

/**
 * Visual representation of the maze grid with racing models
 * Enhanced with darker walls, optimal path visualization in debug mode
 */

import { cn } from "@/lib/utils";
import type { MazeGrid, ModelState, Position } from "@/types";
import { motion } from "motion/react";
import { useMemo } from "react";

interface MazeGridProps {
  maze: MazeGrid;
  models: ModelState[];
  exitPos: Position;
  showFullMaze?: boolean;
  debugMode?: boolean;
  startPos?: Position;
}

export function MazeGridComponent({
  maze,
  models,
  exitPos,
  showFullMaze = true,
  debugMode = false,
  startPos,
}: MazeGridProps) {
  const height = maze.length;
  const width = maze[0]?.length || 0;

  const maxSize =
    typeof window !== "undefined"
      ? Math.min(window.innerWidth * 0.6, 800)
      : 800;
  const cellSize = Math.max(Math.floor(maxSize / Math.max(width, height)), 8);

  const optimalPath = useMemo(() => {
    if (!debugMode || !startPos) return null;
    return calculateOptimalPathPositions(maze, startPos, exitPos);
  }, [debugMode, maze, startPos, exitPos]);

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="relative rounded-lg overflow-hidden border-2 border-border shadow-2xl"
        style={{
          width: width * cellSize,
          height: height * cellSize,
          backgroundColor: "var(--background)",
        }}
      >
        <div
          className="grid gap-0 relative z-0"
          style={{
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
          }}
        >
          {maze.map((row, y) =>
            row.map((cell, x) => {
              const isExit = x === exitPos.x && y === exitPos.y;
              const isStart = startPos && x === startPos.x && y === startPos.y;
              const isOnOptimalPath = optimalPath?.some(
                (p) => p.x === x && p.y === y,
              );

              return (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    "border-[0.5px] relative",
                    cell === "wall"
                      ? "bg-card border-border/40"
                      : isExit
                        ? "bg-accent/20 border-accent/60"
                        : isStart
                          ? "bg-primary/20 border-primary/60"
                          : "bg-card/50 border-border/20",
                    !showFullMaze && cell === "wall" && "opacity-30",
                  )}
                >
                  {debugMode && isOnOptimalPath && cell !== "wall" && (
                    <div className="absolute inset-0 bg-chart-3/10 border border-chart-3/30" />
                  )}

                  {isExit && (
                    <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
                      <div className="text-accent-foreground font-bold text-xs">
                        E
                      </div>
                    </div>
                  )}

                  {isStart && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                      <div className="text-primary-foreground font-bold text-xs">
                        S
                      </div>
                    </div>
                  )}
                </div>
              );
            }),
          )}
        </div>

        {debugMode && optimalPath && optimalPath.length > 1 && (
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: width * cellSize, height: height * cellSize }}
          >
            <path
              d={generatePathD(optimalPath, cellSize)}
              stroke="var(--chart-3)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          </svg>
        )}

        {models.map((model, modelIndex) => {
          if (model.pathTaken.length < 2) return null;

          const totalOffset = cellSize * 0.4;
          const offsetStep =
            models.length > 1 ? totalOffset / (models.length - 1) : 0;
          const offsetX = (modelIndex - (models.length - 1) / 2) * offsetStep;
          const offsetY = (modelIndex - (models.length - 1) / 2) * offsetStep;

          const strokeWidth = Math.max(
            1,
            (cellSize * 0.8) / Math.max(models.length, 1),
          );

          return (
            <svg
              key={`path-${model.config.id}`}
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: width * cellSize, height: height * cellSize }}
            >
              <g transform={`translate(${offsetX}, ${offsetY})`}>
                <path
                  d={generatePathD(model.pathTaken, cellSize)}
                  stroke={model.config.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  opacity="0.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          );
        })}

        {models.map((model) => (
          <motion.div
            key={model.config.id}
            className="absolute rounded-full shadow-lg pointer-events-none z-20"
            style={{
              width: cellSize * 0.7,
              height: cellSize * 0.7,
              backgroundColor: model.config.color,
              boxShadow: `0 0 ${cellSize * 0.5}px ${model.config.color}`,
            }}
            animate={{
              left: model.position.x * cellSize + cellSize * 0.15,
              top: model.position.y * cellSize + cellSize * 0.15,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                backgroundColor: model.config.color,
              }}
            />
            {model.status === "finished" && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                ✓
              </div>
            )}
            {model.status === "stuck" && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                !
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculate optimal path positions using BFS
 */
function calculateOptimalPathPositions(
  maze: MazeGrid,
  start: Position,
  exit: Position,
): Position[] | null {
  const queue: { pos: Position; path: Position[] }[] = [
    { pos: start, path: [start] },
  ];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.pos.x === exit.x && current.pos.y === exit.y) {
      return current.path;
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
      if (!visited.has(key) && isValidPosition(maze, next)) {
        visited.add(key);
        queue.push({
          pos: next,
          path: [...current.path, next],
        });
      }
    }
  }

  return null;
}

/**
 * Check if position is valid
 */
function isValidPosition(maze: MazeGrid, pos: Position): boolean {
  if (
    pos.y < 0 ||
    pos.y >= maze.length ||
    pos.x < 0 ||
    pos.x >= maze[0].length
  ) {
    return false;
  }
  return maze[pos.y][pos.x] !== "wall";
}

/**
 * Generate SVG path d attribute from positions
 */
function generatePathD(positions: Position[], cellSize: number): string {
  if (positions.length === 0) return "";

  const commands: string[] = [];
  positions.forEach((pos, i) => {
    const x = pos.x * cellSize + cellSize / 2;
    const y = pos.y * cellSize + cellSize / 2;
    commands.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  });

  return commands.join(" ");
}
