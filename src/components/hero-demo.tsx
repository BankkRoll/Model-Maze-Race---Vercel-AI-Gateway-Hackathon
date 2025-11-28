"use client";

/**
 * Hero demo component - shows a mini simulation of the maze race
 * Demonstrates the UI/UX with a realistic animated example matching the real game
 *
 * @module HeroDemo
 */

import { RaceHUD } from "@/components/race-hud";
import { generateMaze, getVisibleArea, isValidMove } from "@/lib/maze";
import { cn } from "@/lib/utils";
import type {
  AIChatMessage,
  AIStatus,
  Direction,
  MazeGrid,
  ModelConfig,
  ModelState,
  Position,
} from "@/types";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

interface HeroDemoProps {
  className?: string;
  debugMode?: boolean;
}

/**
 * Demo component showing a mini maze race simulation
 * Matches the real game flow: message → move → message → move
 * Models move independently and can backtrack or get stuck
 *
 * @param props - Component props
 * @param props.className - Optional CSS classes
 * @returns The demo component
 */

/**
 * Calculate optimal path positions using BFS (for debug mode)
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
      if (!visited.has(key) && isValidMove(maze, next)) {
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

export function HeroDemo({ className, debugMode = false }: HeroDemoProps) {
  const [demoMaze, setDemoMaze] = useState<MazeGrid | null>(null);
  const [startPos, setStartPos] = useState<Position | null>(null);
  const [exitPos, setExitPos] = useState<Position | null>(null);
  const [demoModels, setDemoModels] = useState<ModelState[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [modelStatuses, setModelStatuses] = useState<Record<string, AIStatus>>(
    {},
  );
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const optimalPath = useMemo(() => {
    if (!debugMode || !demoMaze || !startPos || !exitPos) return null;
    return calculateOptimalPathPositions(demoMaze, startPos, exitPos);
  }, [debugMode, demoMaze, startPos, exitPos]);

  useEffect(() => {
    const { maze, start, exit } = generateMaze({
      width: 20,
      height: 20,
      difficulty: "medium",
    });

    const edgeStart: Position = { x: 0, y: 0 };
    if (start.x !== edgeStart.x || start.y !== edgeStart.y) {
      maze[start.y][start.x] = "path";
    }
    maze[edgeStart.y][edgeStart.x] = "start";

    const edgeExit: Position = { x: maze[0].length - 1, y: maze.length - 1 };
    if (exit.x !== edgeExit.x || exit.y !== edgeExit.y) {
      maze[exit.y][exit.x] = "path";
    }
    maze[edgeExit.y][edgeExit.x] = "exit";

    if (maze[0][1] === "wall") maze[0][1] = "path";
    if (maze[1][0] === "wall") maze[1][0] = "path";

    const lastRow = maze.length - 1;
    const lastCol = maze[0].length - 1;
    if (maze[lastRow][lastCol - 1] === "wall")
      maze[lastRow][lastCol - 1] = "path";
    if (maze[lastRow - 1][lastCol] === "wall")
      maze[lastRow - 1][lastCol] = "path";

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
    setChatMessages([]);
    setModelStatuses(
      demoModelConfigs.reduce(
        (acc, config) => {
          acc[config.id] = "idle";
          return acc;
        },
        {} as Record<string, AIStatus>,
      ),
    );
  }, []);

  const simulateAIMove = (
    model: ModelState,
    maze: MazeGrid,
    exitPos: Position,
  ): { direction: Direction | null; response: string } => {
    if (!maze || !exitPos) return { direction: null, response: "Error" };

    const visible = getVisibleArea(maze, model.position);
    const directions: Direction[] = ["up", "down", "left", "right"];
    const validMoves: { dir: Direction; pos: Position; dist: number }[] = [];

    for (const dir of directions) {
      const newPos = calculateNewPosition(model.position, dir);
      if (isValidMove(maze, newPos)) {
        const dist =
          Math.abs(newPos.x - exitPos.x) + Math.abs(newPos.y - exitPos.y);
        validMoves.push({ dir, pos: newPos, dist });
      }
    }

    if (validMoves.length === 0) {
      return { direction: null, response: "No valid moves available" };
    }

    if (model.pathTaken.length > 2 && Math.random() < 0.1) {
      const prevPos = model.pathTaken[model.pathTaken.length - 2];
      const backtrackDir = directions.find((dir) => {
        const newPos = calculateNewPosition(model.position, dir);
        return newPos.x === prevPos.x && newPos.y === prevPos.y;
      });
      if (backtrackDir) {
        return {
          direction: backtrackDir,
          response: `Backtracking ${backtrackDir}`,
        };
      }
    }

    validMoves.sort((a, b) => {
      const scoreA = a.dist + (Math.random() * 2 - 1);
      const scoreB = b.dist + (Math.random() * 2 - 1);
      return scoreA - scoreB;
    });

    const chosen = validMoves[0];
    const responses = [
      chosen.dir,
      `Moving ${chosen.dir}`,
      `I'll go ${chosen.dir}`,
      chosen.dir.toUpperCase(),
      `${chosen.dir} seems best`,
    ];

    return {
      direction: chosen.dir,
      response: responses[Math.floor(Math.random() * responses.length)],
    };
  };

  useEffect(() => {
    if (
      !demoMaze ||
      !startPos ||
      !exitPos ||
      demoModels.length === 0 ||
      !isPlaying ||
      isProcessingMove
    )
      return;

    const processNextStep = () => {
      setIsProcessingMove(true);

      const activeModels = demoModels.filter(
        (m) => m.status === "racing" || m.status === "waiting",
      );
      if (activeModels.length === 0) {
        setTimeout(() => {
          setDemoModels((models) =>
            models.map((m) => ({
              ...m,
              position: { ...startPos! },
              pathTaken: [{ ...startPos! }],
              stepCount: 0,
              totalTime: 0,
              lastMoveTime: 0,
              status: "waiting" as const,
            })),
          );
          setChatMessages([]);
          setModelStatuses(
            demoModels.reduce(
              (acc, model) => {
                acc[model.config.id] = "idle";
                return acc;
              },
              {} as Record<string, AIStatus>,
            ),
          );
        }, 2000);
        setIsProcessingMove(false);
        return;
      }

      const stepCounts = activeModels.map((m) => m.stepCount);
      const currentStep = Math.max(...stepCounts, 0);

      const allSameStep =
        stepCounts.length === 0 || stepCounts.every((sc) => sc === currentStep);

      if (!allSameStep) {
        console.error("CRITICAL SYNC ERROR: Step counts differ!", stepCounts);
        setDemoModels((prev) =>
          prev.map((m) => {
            if (m.status === "racing" || m.status === "waiting") {
              return { ...m, stepCount: currentStep };
            }
            return m;
          }),
        );
        setIsProcessingMove(false);
        return;
      }

      setModelStatuses((prev) => {
        const newStatuses = { ...prev };
        activeModels.forEach((model) => {
          newStatuses[model.config.id] = "thinking";
        });
        return newStatuses;
      });

      setTimeout(
        () => {
          setModelStatuses((prev) => {
            const newStatuses = { ...prev };
            activeModels.forEach((model) => {
              newStatuses[model.config.id] = "responding";
            });
            return newStatuses;
          });

          setTimeout(
            () => {
              const newMessages: AIChatMessage[] = [];
              const stepNumber = currentStep + 1;

              const timestamp = Date.now();
              setDemoModels((prev) => {
                const activeModels = prev.filter(
                  (m) => m.status === "racing" || m.status === "waiting",
                );

                const updatedModels = prev.map((model) => {
                  if (model.status !== "racing" && model.status !== "waiting") {
                    return model;
                  }

                  const { direction, response } = simulateAIMove(
                    model,
                    demoMaze,
                    exitPos,
                  );
                  const moveTime = 200 + Math.random() * 200;

                  let finalDirection = direction;
                  if (!finalDirection) {
                    const directions: Direction[] = [
                      "up",
                      "down",
                      "left",
                      "right",
                    ];
                    const validDirs = directions.filter((dir) => {
                      const testPos = calculateNewPosition(model.position, dir);
                      return isValidMove(demoMaze, testPos);
                    });
                    if (validDirs.length > 0) {
                      finalDirection =
                        validDirs[Math.floor(Math.random() * validDirs.length)];
                    } else {
                      finalDirection = "right";
                    }
                  }

                  const newMessage: AIChatMessage = {
                    modelId: model.config.id,
                    timestamp,
                    status: "complete",
                    response: finalDirection
                      ? response
                      : `Moving ${finalDirection}`,
                    stepNumber,
                  };
                  newMessages.push(newMessage);

                  const newPos = calculateNewPosition(
                    model.position,
                    finalDirection,
                  );
                  const reachedExit =
                    newPos.x === exitPos.x && newPos.y === exitPos.y;

                  return {
                    ...model,
                    position: newPos,
                    pathTaken: [...model.pathTaken, newPos],
                    moveHistory: [
                      ...model.moveHistory,
                      {
                        direction: finalDirection,
                        position: newPos,
                        timestamp,
                        success: isValidMove(demoMaze, newPos),
                      },
                    ],
                    stepCount: stepNumber,
                    totalTime: model.totalTime + moveTime,
                    lastMoveTime: moveTime,
                    status: reachedExit
                      ? ("finished" as const)
                      : ("racing" as const),
                  };
                });

                const activeModelsAfter = updatedModels.filter(
                  (m) => m.status === "racing" || m.status === "waiting",
                );
                if (activeModelsAfter.length > 0) {
                  const expectedStepCount = stepNumber;
                  const allHaveSameStep = activeModelsAfter.every(
                    (m) => m.stepCount === expectedStepCount,
                  );

                  if (!allHaveSameStep) {
                    console.error(
                      "CRITICAL: Step count mismatch detected! Forcing synchronization...",
                    );
                    return updatedModels.map((m) => {
                      if (m.status === "racing" || m.status === "waiting") {
                        return { ...m, stepCount: expectedStepCount };
                      }
                      return m;
                    });
                  }
                }

                return updatedModels;
              });

              setChatMessages((prev) => [...prev.slice(-30), ...newMessages]);

              setModelStatuses((prev) => {
                const newStatuses = { ...prev };
                activeModels.forEach((model) => {
                  newStatuses[model.config.id] = "idle";
                });
                return newStatuses;
              });

              setIsProcessingMove(false);
            },
            250 + Math.random() * 150,
          );
        },
        200 + Math.random() * 100,
      );
    };

    if (demoModels.some((m) => m.status === "waiting")) {
      setDemoModels((models) =>
        models.map((m) => ({
          ...m,
          status: m.status === "waiting" ? ("racing" as const) : m.status,
        })),
      );
    }

    intervalRef.current = setInterval(processNextStep, 800);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [demoMaze, startPos, exitPos, demoModels, isPlaying, isProcessingMove]);

  if (!demoMaze || !startPos || !exitPos) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cellSize = 28;
  const width = demoMaze[0].length;
  const height = demoMaze.length;

  return (
    <div className={`w-full ${className}`}>
      <div className="grid lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-7xl mx-auto px-2 sm:px-3 md:px-4">
        <div className="lg:col-span-2 flex items-center justify-center p-1 sm:p-2 md:p-4 min-w-0 overflow-hidden">
          <div className="relative rounded-lg overflow-hidden border-2 border-border/50 shadow-xl bg-background/50 backdrop-blur-sm w-full max-w-full">
            <div
              className="relative w-full"
              style={{
                aspectRatio: `${width} / ${height}`,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            >
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  width: `${width * cellSize}px`,
                  height: `${height * cellSize}px`,
                }}
              >
                <div
                  className="grid gap-0 absolute inset-0"
                  style={{
                    gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
                  }}
                >
                  {demoMaze.map((row, y) =>
                    row.map((cell, x) => {
                      const isExit = x === exitPos.x && y === exitPos.y;
                      const isStart = x === startPos.x && y === startPos.y;
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
                          )}
                        >
                          {debugMode && isOnOptimalPath && cell !== "wall" && (
                            <div className="absolute inset-0 bg-chart-3/10 border border-chart-3/30" />
                          )}
                        </div>
                      );
                    }),
                  )}
                </div>

                {debugMode && optimalPath && optimalPath.length > 1 && (
                  <svg
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      width: width * cellSize,
                      height: height * cellSize,
                    }}
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

                {demoModels.map((model, modelIndex) => {
                  if (model.pathTaken.length < 2) return null;

                  const totalOffset = cellSize * 0.4;
                  const offsetStep = totalOffset / (demoModels.length - 1 || 1);
                  const offsetX =
                    (modelIndex - (demoModels.length - 1) / 2) * offsetStep;
                  const offsetY =
                    (modelIndex - (demoModels.length - 1) / 2) * offsetStep;

                  const strokeWidth = Math.max(
                    1,
                    (cellSize * 0.8) / demoModels.length,
                  );

                  return (
                    <svg
                      key={`path-${model.config.id}`}
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        width: width * cellSize,
                        height: height * cellSize,
                      }}
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

                {demoModels.map((model) => (
                  <motion.div
                    key={model.config.id}
                    className="absolute rounded-full shadow-lg pointer-events-none z-20"
                    style={{
                      width: cellSize * 0.7,
                      height: cellSize * 0.7,
                      backgroundColor: model.config.color,
                      boxShadow: `0 0 ${cellSize * 0.4}px ${model.config.color}`,
                    }}
                    animate={{
                      left: model.position.x * cellSize + cellSize * 0.15,
                      top: model.position.y * cellSize + cellSize * 0.15,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-60"
                      style={{
                        backgroundColor: model.config.color,
                      }}
                    />
                    {model.status === "finished" && (
                      <div className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white">
                        ✓
                      </div>
                    )}
                    {model.status === "stuck" && (
                      <div className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white">
                        !
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 w-full min-w-0">
          <div className="h-[350px] xs:h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] w-full">
            <RaceHUD
              models={demoModels}
              currentStep={Math.max(...demoModels.map((m) => m.stepCount), 0)}
              maxTurns={100}
              chatMessages={chatMessages}
              modelStatuses={modelStatuses}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate new position based on direction
 */
function calculateNewPosition(pos: Position, direction: Direction): Position {
  switch (direction) {
    case "up":
      return { x: pos.x, y: pos.y - 1 };
    case "down":
      return { x: pos.x, y: pos.y + 1 };
    case "left":
      return { x: pos.x - 1, y: pos.y };
    case "right":
      return { x: pos.x + 1, y: pos.y };
  }
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
