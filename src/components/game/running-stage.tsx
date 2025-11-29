"use client";

/**
 * Running stage component for active race display
 * Shows maze visualization, race controls, and HUD
 *
 * @module RunningStage
 */

import { DebugPanel } from "@/components/game/debug-panel";
import { MazeGridComponent } from "@/components/game/maze-grid";
import { RaceHUD } from "@/components/game/race-hud";
import type {
  AIChatMessage,
  AIStatus,
  DebugInfo,
  MazeGrid,
  ModelState,
  Position,
} from "@/types";
import { motion } from "motion/react";

/**
 * Props for the RunningStage component
 *
 * @interface RunningStageProps
 */
interface RunningStageProps {
  /** Current maze grid */
  maze: MazeGrid | null;
  /** Array of model states */
  models: ModelState[];
  /** Exit position in the maze */
  exitPos: Position | null;
  /** Start position in the maze */
  startPos: Position | null;
  /** Whether to show the full maze */
  showFullMaze: boolean;
  /** Whether debug mode is enabled */
  debugMode: boolean;
  /** Whether the race is currently running */
  isRunning: boolean;
  /** Whether the race is paused */
  isPaused: boolean;
  /** Debug logs for display */
  debugLogs: DebugInfo[];
  /** Chat messages from AI models */
  chatMessages: AIChatMessage[];
  /** Status of each model */
  modelStatuses: Record<string, AIStatus>;
  /** Maximum number of turns */
  maxTurns: number;
  /** Callback when race is started */
  onStartRace: () => void;
  /** Callback when race is paused */
  onPauseRace: () => void;
  /** Callback when race is resumed */
  onResumeRace: () => void;
  /** Callback when race is stopped */
  onStopRace: () => void;
  /** Callback when race is reset */
  onReset: () => void;
  /** Callback to regenerate the maze with current config */
  onRegenerateMaze: () => void;
}

/**
 * Running stage component
 * Displays the active race with maze visualization, controls, and status information
 *
 * @param props - RunningStage component props
 * @returns RunningStage JSX element
 *
 * @example
 * ```tsx
 * <RunningStage
 *   maze={mazeGrid}
 *   models={modelStates}
 *   exitPos={exitPosition}
 *   startPos={startPosition}
 *   showFullMaze={true}
 *   debugMode={false}
 *   isRunning={true}
 *   isPaused={false}
 *   debugLogs={[]}
 *   chatMessages={[]}
 *   modelStatuses={{}}
 *   maxTurns={500}
 *   onStartRace={() => startRace()}
 *   onPauseRace={() => pauseRace()}
 *   onResumeRace={() => resumeRace()}
 *   onStopRace={() => stopRace()}
 *   onReset={() => resetRace()}
 *   onRegenerateMaze={() => createNewMaze(mazeConfig)}
 * />
 * ```
 */
export function RunningStage({
  maze,
  models,
  exitPos,
  startPos,
  showFullMaze,
  debugMode,
  isRunning,
  isPaused,
  debugLogs,
  chatMessages,
  modelStatuses,
  maxTurns,
  onStartRace,
  onPauseRace,
  onResumeRace,
  onStopRace,
  onReset,
  onRegenerateMaze,
}: RunningStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 py-6"
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {maze && exitPos && startPos && (
            <MazeGridComponent
              maze={maze}
              models={models}
              exitPos={exitPos}
              startPos={startPos}
              showFullMaze={showFullMaze}
              debugMode={debugMode}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <RaceHUD
            models={models}
            currentStep={0}
            maxTurns={maxTurns}
            chatMessages={chatMessages}
            modelStatuses={modelStatuses}
            isRunning={isRunning}
            isPaused={isPaused}
            onStartRace={onStartRace}
            onPauseRace={onPauseRace}
            onResumeRace={onResumeRace}
            onStopRace={onStopRace}
            onReset={onReset}
            onRegenerateMaze={onRegenerateMaze}
          />
        </div>
      </div>

      {debugMode && <DebugPanel logs={debugLogs} visible={debugMode} />}
    </motion.div>
  );
}
