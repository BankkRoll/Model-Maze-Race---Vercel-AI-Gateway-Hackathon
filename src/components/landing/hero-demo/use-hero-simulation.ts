/**
 * Custom hook for hero demo simulation logic
 *
 * @module UseHeroSimulation
 */

import { isValidMove } from "@/lib/maze";
import type {
  AIChatMessage,
  AIStatus,
  Direction,
  MazeGrid,
  ModelState,
  Position,
} from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { simulateAIMove } from "./simulate-ai-move";
import { calculateNewPosition } from "./utils";

interface UseHeroSimulationProps {
  demoMaze: MazeGrid | null;
  startPos: Position | null;
  exitPos: Position | null;
  demoModels: ModelState[];
  isPlaying: boolean;
}

interface UseHeroSimulationResult {
  models: ModelState[];
  chatMessages: AIChatMessage[];
  modelStatuses: Record<string, AIStatus>;
  isProcessingMove: boolean;
  resetRace: () => void;
}

/**
 * Hook for managing hero demo simulation
 *
 * @param props - Simulation configuration
 * @returns Simulation state
 */
export function useHeroSimulation({
  demoMaze,
  startPos,
  exitPos,
  demoModels: initialModels,
  isPlaying,
}: UseHeroSimulationProps): UseHeroSimulationResult {
  const [models, setModels] = useState<ModelState[]>(initialModels);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [modelStatuses, setModelStatuses] = useState<Record<string, AIStatus>>(
    {},
  );
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const modelsRef = useRef<ModelState[]>(initialModels);
  const isMountedRef = useRef(true);
  const mazeRef = useRef(demoMaze);
  const startPosRef = useRef(startPos);
  const exitPosRef = useRef(exitPos);
  const isProcessingMoveRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    mazeRef.current = demoMaze;
    startPosRef.current = startPos;
    exitPosRef.current = exitPos;
  }, [demoMaze, startPos, exitPos]);

  useEffect(() => {
    if (initialModels.length > 0) {
      modelsRef.current = initialModels;
      setModels(initialModels);
      setIsProcessingMove(false);
      isProcessingMoveRef.current = false;
    }
  }, [initialModels]);

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  useEffect(() => {
    isProcessingMoveRef.current = isProcessingMove;
  }, [isProcessingMove]);

  useEffect(() => {
    if (
      !demoMaze ||
      !startPos ||
      !exitPos ||
      initialModels.length === 0 ||
      !isPlaying
    )
      return;

    const processNextStep = () => {
      if (!isMountedRef.current) return;

      if (isProcessingMoveRef.current) return;

      setIsProcessingMove(true);
      isProcessingMoveRef.current = true;

      const currentModels = modelsRef.current;
      const activeModels = currentModels.filter(
        (m) => m.status === "racing" || m.status === "waiting",
      );

      if (activeModels.length === 0) {
        const timeout = setTimeout(() => {
          if (!isMountedRef.current) return;
          timeoutRefs.current.delete(timeout);
          const currentStartPos = startPosRef.current;
          if (!currentStartPos) {
            setIsProcessingMove(false);
            isProcessingMoveRef.current = false;
            return;
          }
          setModels((prev) =>
            prev.map((m) => ({
              ...m,
              position: { ...currentStartPos },
              pathTaken: [{ ...currentStartPos }],
              stepCount: 0,
              totalTime: 0,
              lastMoveTime: 0,
              status: "waiting" as const,
            })),
          );
          setChatMessages([]);
          setModelStatuses(
            currentModels.reduce(
              (acc, model) => {
                acc[model.config.id] = "idle";
                return acc;
              },
              {} as Record<string, AIStatus>,
            ),
          );
          setIsProcessingMove(false);
        }, 2000);
        timeoutRefs.current.add(timeout);
        setIsProcessingMove(false);
        isProcessingMoveRef.current = false;
        return;
      }

      const stepCounts = activeModels.map((m) => m.stepCount);
      const currentStep = Math.max(...stepCounts, 0);
      const allSameStep =
        stepCounts.length === 0 || stepCounts.every((sc) => sc === currentStep);

      if (!allSameStep) {
        setModels((prev) =>
          prev.map((m) => {
            if (m.status === "racing" || m.status === "waiting") {
              return { ...m, stepCount: currentStep };
            }
            return m;
          }),
        );
        setIsProcessingMove(false);
        isProcessingMoveRef.current = false;
        return;
      }

      setModelStatuses((prev) => {
        const newStatuses = { ...prev };
        activeModels.forEach((model) => {
          newStatuses[model.config.id] = "thinking";
        });
        return newStatuses;
      });

      const timeout1 = setTimeout(
        () => {
          if (!isMountedRef.current) return;
          timeoutRefs.current.delete(timeout1);

          setModelStatuses((prev) => {
            const newStatuses = { ...prev };
            activeModels.forEach((model) => {
              newStatuses[model.config.id] = "responding";
            });
            return newStatuses;
          });

          const timeout2 = setTimeout(
            () => {
              if (!isMountedRef.current) return;
              timeoutRefs.current.delete(timeout2);

              const currentMaze = mazeRef.current;
              const currentExitPos = exitPosRef.current;
              if (!currentMaze || !currentExitPos) {
                setIsProcessingMove(false);
                isProcessingMoveRef.current = false;
                return;
              }

              const newMessages: AIChatMessage[] = [];
              const stepNumber = currentStep + 1;
              const timestamp = Date.now();

              setModels((prev) => {
                const activeModels = prev.filter(
                  (m) => m.status === "racing" || m.status === "waiting",
                );

                const updatedModels = prev.map((model) => {
                  if (model.status !== "racing" && model.status !== "waiting") {
                    return model;
                  }

                  const { direction, response } = simulateAIMove(
                    model,
                    currentMaze,
                    currentExitPos,
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
                      return isValidMove(currentMaze, testPos);
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
                    newPos.x === currentExitPos.x &&
                    newPos.y === currentExitPos.y;

                  const limitedPathTaken = [...model.pathTaken, newPos].slice(
                    -200,
                  );
                  const limitedMoveHistory = [
                    ...model.moveHistory,
                    {
                      direction: finalDirection,
                      position: newPos,
                      timestamp,
                      success: isValidMove(currentMaze, newPos),
                    },
                  ].slice(-200);

                  return {
                    ...model,
                    position: newPos,
                    pathTaken: limitedPathTaken,
                    moveHistory: limitedMoveHistory,
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

              setChatMessages((prev) => [...prev.slice(-50), ...newMessages]);

              setModelStatuses((prev) => {
                const newStatuses = { ...prev };
                activeModels.forEach((model) => {
                  newStatuses[model.config.id] = "idle";
                });
                return newStatuses;
              });

              setIsProcessingMove(false);
              isProcessingMoveRef.current = false;
            },
            250 + Math.random() * 150,
          );
          timeoutRefs.current.add(timeout2);
        },
        200 + Math.random() * 100,
      );
      timeoutRefs.current.add(timeout1);
    };

    setModels((prev) => {
      if (prev.some((m) => m.status === "waiting")) {
        const updated = prev.map((m) => ({
          ...m,
          status: m.status === "waiting" ? ("racing" as const) : m.status,
        }));
        modelsRef.current = updated;
        return updated;
      }
      return prev;
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();

    setIsProcessingMove(false);
    isProcessingMoveRef.current = false;

    intervalRef.current = setInterval(processNextStep, 800);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, [demoMaze, startPos, exitPos, initialModels.length, isPlaying]);

  const resetRace = useCallback(() => {
    if (!startPosRef.current) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();

    setIsProcessingMove(false);
    isProcessingMoveRef.current = false;

    const modelsToReset =
      initialModels.length > 0 ? initialModels : modelsRef.current;

    if (modelsToReset.length === 0) return;

    const resetModels = modelsToReset.map((m) => ({
      ...m,
      position: { ...startPosRef.current! },
      pathTaken: [{ ...startPosRef.current! }],
      stepCount: 0,
      totalTime: 0,
      lastMoveTime: 0,
      moveHistory: [],
      status: "waiting" as const,
    }));

    setModels(resetModels);
    modelsRef.current = resetModels;
    setChatMessages([]);
    setModelStatuses(
      modelsToReset.reduce(
        (acc, model) => {
          acc[model.config.id] = "idle";
          return acc;
        },
        {} as Record<string, AIStatus>,
      ),
    );
  }, [initialModels]);

  return {
    models,
    chatMessages,
    modelStatuses,
    isProcessingMove,
    resetRace,
  };
}
