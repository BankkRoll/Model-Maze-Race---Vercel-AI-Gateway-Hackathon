"use client";

/**
 * Visual representation of the maze grid with racing models
 * Enhanced with darker walls, optimal path visualization in debug mode
 */

import { findAllPaths } from "@/lib/maze";
import { getGamePathfindingConfig } from "@/lib/pathfinding-config";
import { cn } from "@/lib/utils";
import type { MazeConfig, MazeGrid, ModelState, Position } from "@/types";
import { motion } from "motion/react";
import { memo, useMemo, useRef } from "react";

interface MazeGridProps {
  maze: MazeGrid;
  models: ModelState[];
  exitPos: Position;
  debugMode?: boolean;
  startPos?: Position;
  mazeConfig?: MazeConfig;
}

function MazeGridComponentInner({
  maze,
  models,
  exitPos,
  debugMode = false,
  startPos,
  mazeConfig,
}: MazeGridProps) {
  const height = maze.length;
  const width = maze[0]?.length || 0;

  const maxSize =
    typeof window !== "undefined"
      ? Math.min(window.innerWidth * 0.6, 800)
      : 800;
  const cellSize = Math.max(Math.floor(maxSize / Math.max(width, height)), 8);

  const mazeRef = useRef<string>("");
  const pathsCacheRef = useRef<Position[][]>([]);

  const allPaths = useMemo(() => {
    if (!debugMode || !startPos) return [];

    const mazeSignature = JSON.stringify({
      maze: maze.map((row) => row.join(",")).join("|"),
      start: `${startPos.x},${startPos.y}`,
      exit: `${exitPos.x},${exitPos.y}`,
    });

    if (mazeRef.current === mazeSignature && pathsCacheRef.current.length > 0) {
      return pathsCacheRef.current;
    }

    try {
      const config = mazeConfig
        ? getGamePathfindingConfig(mazeConfig.difficulty)
        : getGamePathfindingConfig("medium");
      const paths = findAllPaths(
        maze,
        startPos,
        exitPos,
        config.maxPaths,
        config.maxPathLength,
        config.maxRevisits,
        config.similarityThreshold,
        config.maxPathsToTry,
      );
      mazeRef.current = mazeSignature;
      pathsCacheRef.current = paths;
      return paths;
    } catch (error) {
      console.error("[Pathfinder] Error finding paths:", error);
      return [];
    }
  }, [debugMode, maze, startPos, exitPos]);

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

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-2">
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
              const isReachable = reachableCells.has(`${x},${y}`);

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
                    cell === "wall" && "opacity-30",
                  )}
                >
                  {debugMode && isReachable && cell !== "wall" && (
                    <div className="absolute inset-0 bg-chart-3/15 border border-chart-3/30 z-0" />
                  )}

                  {isExit && (
                    <div className="absolute inset-0 flex items-center justify-center bg-accent/30 z-10">
                      <div className="text-accent-foreground font-bold text-xs">
                        E
                      </div>
                    </div>
                  )}

                  {isStart && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/30 z-10">
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

        {debugMode && allPaths.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: width * cellSize, height: height * cellSize }}
          >
            {allPaths.map((path, pathIndex) => (
              <path
                key={`path-${pathIndex}`}
                d={generatePathD(path, cellSize)}
                stroke="#a855f7"
                strokeWidth={1}
                fill="none"
                strokeDasharray="4 4"
                opacity={0.6}
              />
            ))}
          </svg>
        )}

        {models.some((m) => m.pathTaken.length >= 2) && (
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: width * cellSize, height: height * cellSize }}
          >
            {models.map((model, modelIndex) => {
              if (model.pathTaken.length < 2) return null;

              const totalOffset = cellSize * 0.4;
              const offsetStep =
                models.length > 1 ? totalOffset / (models.length - 1) : 0;
              const offsetX =
                (modelIndex - (models.length - 1) / 2) * offsetStep;
              const offsetY =
                (modelIndex - (models.length - 1) / 2) * offsetStep;

              const strokeWidth = Math.max(
                1,
                (cellSize * 0.8) / Math.max(models.length, 1),
              );

              return (
                <g
                  key={`path-${model.config.id}`}
                  transform={`translate(${offsetX}, ${offsetY})`}
                >
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
              );
            })}
          </svg>
        )}

        {models.map((model, modelIndex) => {
          const trailEnd =
            model.pathTaken.length > 0
              ? model.pathTaken[model.pathTaken.length - 1]
              : model.position;

          const totalOffset = cellSize * 0.3;
          const offsetStep =
            models.length > 1 ? totalOffset / (models.length - 1) : 0;
          const offsetX = (modelIndex - (models.length - 1) / 2) * offsetStep;
          const offsetY = (modelIndex - (models.length - 1) / 2) * offsetStep;

          return (
            <motion.div
              key={model.config.id}
              className="absolute rounded-full shadow-lg pointer-events-none z-20"
              style={{
                width: cellSize * 0.5,
                height: cellSize * 0.5,
                backgroundColor: model.config.color,
                boxShadow: `0 0 ${cellSize * 0.3}px ${model.config.color}`,
              }}
              animate={{
                left: trailEnd.x * cellSize + cellSize * 0.25 + offsetX,
                top: trailEnd.y * cellSize + cellSize * 0.25 + offsetY,
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
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  ✓
                </div>
              )}
              {model.status === "stuck" && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  !
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      {debugMode && allPaths.length > 0 && (
        <div className="text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-1.5 rounded-md border border-border/50">
          <span className="font-semibold text-foreground">Unique Paths: </span>
          {allPaths.length}
          <span className="text-muted-foreground/70">
            {" "}
            (significantly different routes)
          </span>
          <span className="mx-2">|</span>
          <span className="font-semibold text-foreground">Shortest: </span>
          {allPaths[0]?.length} steps
          <span className="mx-2">|</span>
          <span className="font-semibold text-foreground">Longest: </span>
          {allPaths[allPaths.length - 1]?.length} steps
        </div>
      )}
    </div>
  );
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

export const MazeGridComponent = memo(MazeGridComponentInner);
