/**
 * Maze grid component for hero demo
 *
 * @module HeroMazeGrid
 */

import { cn } from "@/lib/utils";
import type { MazeGrid, Position } from "@/types";
import { memo } from "react";

interface HeroMazeGridProps {
  maze: MazeGrid;
  startPos: Position;
  exitPos: Position;
  reachableCells: Set<string>;
  debugMode: boolean;
}

/**
 * Renders the maze grid cells
 */
export const HeroMazeGrid = memo(function HeroMazeGrid({
  maze,
  startPos,
  exitPos,
  reachableCells,
  debugMode,
}: HeroMazeGridProps) {
  const width = maze[0].length;
  const height = maze.length;

  return (
    <div
      className="grid gap-0 w-full h-full"
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
      }}
    >
      {maze.map((row, y) =>
        row.map((cell, x) => {
          const isExit = x === exitPos.x && y === exitPos.y;
          const isStart = x === startPos.x && y === startPos.y;
          const isReachable = reachableCells.has(`${x},${y}`);

          return (
            <div
              key={`${x}-${y}`}
              className={cn(
                "border-[0.5px] relative",
                cell === "wall"
                  ? "bg-muted border-border"
                  : isExit
                    ? "bg-accent border-accent"
                    : isStart
                      ? "bg-primary border-primary"
                      : "bg-background border-border",
              )}
            >
              {debugMode &&
                isReachable &&
                cell !== "wall" &&
                !isExit &&
                !isStart && (
                  <div className="absolute inset-0 bg-chart-3/15 border border-chart-3/30" />
                )}

              {isExit && (
                <div className="absolute inset-0 flex items-center justify-center bg-accent z-10">
                  <div className="text-accent-foreground font-bold text-xs">
                    E
                  </div>
                </div>
              )}

              {isStart && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary z-10">
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
  );
});
