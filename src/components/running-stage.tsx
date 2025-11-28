"use client";

/**
 * Running stage component for active race display
 * Shows maze visualization, race controls, and HUD
 *
 * @module RunningStage
 */

import { DebugPanel } from "@/components/debug-panel";
import { MazeGridComponent } from "@/components/maze-grid";
import { RaceHUD } from "@/components/race-hud";
import { Button } from "@/components/ui/button";
import type {
  AIChatMessage,
  AIStatus,
  DebugInfo,
  MazeGrid,
  ModelState,
  Position,
} from "@/types";
import { Pause, Play, Square } from "lucide-react";
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
}: RunningStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 py-6"
    >
      <div className="flex items-center justify-center gap-4">
        {!isRunning ? (
          <Button
            size="lg"
            onClick={onStartRace}
            disabled={models.length === 0}
            className="min-w-[140px]"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Race
          </Button>
        ) : isPaused ? (
          <Button size="lg" onClick={onResumeRace} className="min-w-[140px]">
            <Play className="w-5 h-5 mr-2" />
            Resume
          </Button>
        ) : (
          <Button size="lg" onClick={onPauseRace} className="min-w-[140px]">
            <Pause className="w-5 h-5 mr-2" />
            Pause
          </Button>
        )}

        <Button
          size="lg"
          variant="outline"
          onClick={onStopRace}
          disabled={!isRunning}
          className="min-w-[140px] bg-transparent"
        >
          <Square className="w-5 h-5 mr-2" />
          Stop
        </Button>

        <Button
          size="lg"
          variant="destructive"
          onClick={onReset}
          className="min-w-[140px]"
        >
          Reset
        </Button>
      </div>

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
          />
        </div>
      </div>

      {debugMode && <DebugPanel logs={debugLogs} visible={debugMode} />}
    </motion.div>
  );
}
