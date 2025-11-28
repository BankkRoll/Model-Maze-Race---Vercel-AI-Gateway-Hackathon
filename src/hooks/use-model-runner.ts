"use client";

/**
 * Custom hook for managing AI model racing logic
 * Handles race execution, model turns, and state management
 *
 * @module useModelRunner
 */

import { requestModelMove } from "@/lib/ai";
import { getVisibleArea, isValidMove } from "@/lib/maze";
import type {
  AIChatMessage,
  AIStatus,
  DebugInfo,
  Direction,
  MazeGrid,
  ModelConfig,
  ModelState,
  Position,
} from "@/types";
import { useCallback, useRef, useState } from "react";

/**
 * Props for the useModelRunner hook
 *
 * @interface UseModelRunnerProps
 */
interface UseModelRunnerProps {
  /** Maximum number of turns before a model times out */
  maxTurns: number;
  /** Speed multiplier for race execution (1x, 5x, 10x, etc.) */
  speedMultiplier: number;
  /** Whether to enable debug logging */
  debugMode: boolean;
  /** Optional API key for AI model requests */
  apiKey?: string | null;
}

/**
 * Hook for managing AI model racing
 * Provides race control functions and state tracking
 *
 * @param props - Configuration for the model runner
 * @returns Object containing race state and control functions
 *
 * @example
 * ```tsx
 * const runner = useModelRunner({
 *   maxTurns: 100,
 *   speedMultiplier: 5,
 *   debugMode: false,
 *   apiKey: "your-api-key"
 * })
 *
 * runner.initializeModels(modelConfigs, startPosition)
 * runner.startRace(maze, exitPosition)
 * ```
 */
export function useModelRunner({
  maxTurns,
  speedMultiplier,
  debugMode,
  apiKey,
}: UseModelRunnerProps) {
  const [models, setModels] = useState<ModelState[]>([]);
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [modelStatuses, setModelStatuses] = useState<Record<string, AIStatus>>(
    {},
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Initialize models at the starting position
   * Resets all model states and prepares them for a new race
   *
   * @param configs - Array of model configurations to initialize
   * @param startPos - Starting position for all models
   */
  const initializeModels = useCallback(
    (configs: ModelConfig[], startPos: Position) => {
      const initialModels: ModelState[] = configs.map((config) => ({
        config,
        position: { ...startPos },
        moveHistory: [],
        status: "waiting" as const,
        stepCount: 0,
        totalTime: 0,
        lastMoveTime: 0,
        pathTaken: [{ ...startPos }],
      }));
      setModels(initialModels);
      setDebugLogs([]);
      setChatMessages([]);
      const initialStatuses: Record<string, AIStatus> = {};
      configs.forEach((config) => {
        initialStatuses[config.id] = "idle";
      });
      setModelStatuses(initialStatuses);
    },
    [],
  );

  /**
   * Execute one turn for a specific model
   * Requests a move from the AI model and updates its state
   *
   * @param modelState - Current state of the model
   * @param maze - The maze grid
   * @param exitPos - Position of the exit
   * @returns Updated model state after the turn
   */
  const executeModelTurn = useCallback(
    async (
      modelState: ModelState,
      maze: MazeGrid,
      exitPos: Position,
    ): Promise<ModelState> => {
      const startTime = performance.now();

      setModelStatuses((prev) => ({
        ...prev,
        [modelState.config.id]: "thinking",
      }));

      const visible = getVisibleArea(maze, modelState.position);

      const handleStatusUpdate = (status: AIStatus, text?: string) => {
        setModelStatuses((prev) => ({
          ...prev,
          [modelState.config.id]: status,
        }));

        if (status === "complete" && text) {
          const message: AIChatMessage = {
            modelId: modelState.config.id,
            timestamp: Date.now(),
            status: "complete",
            response: text,
            stepNumber: modelState.stepCount + 1,
          };
          setChatMessages((prev) => [...prev.slice(-50), message]);
        }
      };

      const { direction, rawResponse, prompt } = await requestModelMove(
        modelState.config.modelString,
        visible,
        modelState.moveHistory.map((m) => m.direction),
        modelState.stepCount,
        apiKey || undefined,
        handleStatusUpdate,
      );

      const moveTime = performance.now() - startTime;

      if (debugMode) {
        const debugInfo: DebugInfo = {
          modelId: modelState.config.id,
          step: modelState.stepCount + 1,
          prompt,
          response: rawResponse,
          visibleArea: visible,
          timestamp: Date.now(),
        };
        setDebugLogs((prev) => [...prev, debugInfo]);
      }

      setModelStatuses((prev) => ({ ...prev, [modelState.config.id]: "idle" }));

      if (!direction) {
        return {
          ...modelState,
          status: "stuck",
          lastMoveTime: moveTime,
          totalTime: modelState.totalTime + moveTime,
        };
      }

      const newPos = calculateNewPosition(modelState.position, direction);

      if (!isValidMove(maze, newPos)) {
        return {
          ...modelState,
          moveHistory: [
            ...modelState.moveHistory,
            {
              direction,
              position: modelState.position,
              timestamp: Date.now(),
              success: false,
            },
          ],
          stepCount: modelState.stepCount + 1,
          lastMoveTime: moveTime,
          totalTime: modelState.totalTime + moveTime,
        };
      }

      const newPathTaken = [...modelState.pathTaken, newPos];

      const reachedExit = newPos.x === exitPos.x && newPos.y === exitPos.y;

      return {
        ...modelState,
        position: newPos,
        moveHistory: [
          ...modelState.moveHistory,
          {
            direction,
            position: newPos,
            timestamp: Date.now(),
            success: true,
          },
        ],
        stepCount: modelState.stepCount + 1,
        status: reachedExit ? "finished" : "racing",
        lastMoveTime: moveTime,
        totalTime: modelState.totalTime + moveTime,
        pathTaken: newPathTaken,
      };
    },
    [apiKey, debugMode],
  );

  /**
   * Start the race
   * Begins executing turns for all active models until completion or timeout
   *
   * @param maze - The maze grid to race in
   * @param exitPos - Position of the exit
   */
  const startRace = useCallback(
    async (maze: MazeGrid, exitPos: Position) => {
      setIsRunning(true);
      setIsPaused(false);
      abortControllerRef.current = new AbortController();

      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          status: m.status === "waiting" ? "racing" : m.status,
        })),
      );

      let currentModels: ModelState[] = models.map((m) => ({
        ...m,
        status: m.status === "waiting" ? ("racing" as const) : m.status,
      }));

      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        if (isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        const activeModels = currentModels.filter(
          (m) => m.status === "racing" && m.stepCount < maxTurns,
        );

        if (activeModels.length === 0) {
          setIsRunning(false);
          break;
        }

        const updates = await Promise.all(
          currentModels.map(async (model) => {
            if (model.status !== "racing" || model.stepCount >= maxTurns) {
              if (model.stepCount >= maxTurns && model.status === "racing") {
                return { ...model, status: "timeout" as const };
              }
              return model;
            }
            return executeModelTurn(model, maze, exitPos);
          }),
        );

        currentModels = updates;
        setModels(updates);

        const delay = 1000 / speedMultiplier;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      setIsRunning(false);
    },
    [models, maxTurns, isPaused, executeModelTurn, speedMultiplier],
  );

  /**
   * Pause the race
   * Models will stop executing turns until resumed
   */
  const pauseRace = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Resume the race
   * Continues executing turns for active models
   */
  const resumeRace = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * Stop the race
   * Aborts all ongoing operations and resets race state
   */
  const stopRace = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  return {
    models,
    debugLogs,
    chatMessages,
    modelStatuses,
    isRunning,
    isPaused,
    initializeModels,
    startRace,
    pauseRace,
    resumeRace,
    stopRace,
  };
}

/**
 * Calculate new position based on direction
 *
 * @param pos - Current position
 * @param direction - Direction to move
 * @returns New position after moving in the specified direction
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
