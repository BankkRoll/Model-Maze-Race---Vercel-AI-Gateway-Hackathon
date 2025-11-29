"use client";

/**
 * Heads-up display showing race statistics and model status with integrated live AI chat
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AIChatMessage, AIStatus, ModelState } from "@/types";
import {
  Brain,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

interface RaceHUDProps {
  models: ModelState[];
  currentStep: number;
  maxTurns: number;
  chatMessages: AIChatMessage[];
  modelStatuses: Record<string, AIStatus>;
  isRunning: boolean;
  isPaused: boolean;
  onStartRace: () => void;
  onPauseRace: () => void;
  onResumeRace: () => void;
  onStopRace: () => void;
  onReset: () => void;
  onRegenerateMaze: () => void;
  /** Hide reset and regenerate buttons (for landing page demo) */
  hideControlButtons?: boolean;
}

export function RaceHUD({
  models,
  currentStep,
  maxTurns,
  chatMessages,
  modelStatuses,
  isRunning,
  isPaused,
  onStartRace,
  onPauseRace,
  onResumeRace,
  onStopRace,
  onReset,
  onRegenerateMaze,
  hideControlButtons = false,
}: RaceHUDProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <Card className="gap-0 p-2 sm:p-2.5 bg-card/50 backdrop-blur-sm border-border/50 h-full w-full flex flex-col overflow-hidden">
      <div className="mb-1.5 sm:mb-2 pb-1 sm:pb-1.5 border-b border-border/50 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-xs sm:text-sm text-foreground">
            Race Status
          </h3>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-mono shrink-0">
            {models.length} models
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isRunning ? (
            <Button
              size="sm"
              onClick={onStartRace}
              disabled={models.length === 0}
              className="gap-1.5 h-7 text-xs"
            >
              <Play className="w-3 h-3" />
              Start
            </Button>
          ) : isPaused ? (
            <Button
              size="sm"
              onClick={onResumeRace}
              className="gap-1.5 h-7 text-xs"
            >
              <Play className="w-3 h-3" />
              Resume
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onPauseRace}
              className="gap-1.5 h-7 text-xs"
            >
              <Pause className="w-3 h-3" />
              Pause
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onStopRace}
            disabled={!isRunning}
            className="gap-1.5 h-7 text-xs"
          >
            <Square className="w-3 h-3" />
            Stop
          </Button>

          {!hideControlButtons && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onRegenerateMaze}
                className="gap-1.5 h-7 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={onReset}
                className="gap-1.5 h-7 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div
            ref={scrollRef}
            className="space-y-1 sm:space-y-1.5 pr-2 sm:pr-3"
          >
            {models.map((model, index) => {
              const modelMessages = chatMessages.filter(
                (msg) => msg.modelId === model.config.id,
              );
              const latestMessage = modelMessages[modelMessages.length - 1];
              const currentStatus = modelStatuses[model.config.id] || "idle";
              const messageCount = modelMessages.length;

              return (
                <motion.div
                  key={model.config.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="gap-0 p-1.5 sm:p-2 bg-background/30 border-border/50 hover:border-border/70 transition-colors">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: model.config.color,
                          boxShadow: `0 0 6px ${model.config.color}`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-[10px] sm:text-xs text-foreground truncate">
                            {model.config.name}
                          </h4>
                          <StatusBadge status={model.status} />
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate mt-0.5">
                          {model.config.modelString}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 text-[9px] sm:text-[10px]">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Steps</span>
                        <span className="font-mono font-semibold text-foreground">
                          {model.stepCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-mono font-semibold text-foreground">
                          {(model.totalTime / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Last</span>
                        <span className="font-mono font-semibold text-foreground">
                          {model.lastMoveTime > 0
                            ? `${model.lastMoveTime.toFixed(0)}ms`
                            : "-"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Msgs</span>
                        <span className="font-mono font-semibold text-foreground">
                          {messageCount}
                        </span>
                      </div>
                    </div>

                    <div className="mb-1 sm:mb-1.5 h-0.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: model.config.color }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(model.stepCount / maxTurns) * 100}%`,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <div className="border-t border-border/30 pt-1 sm:pt-1.5">
                      <AnimatePresence mode="wait">
                        {currentStatus === "thinking" && (
                          <motion.div
                            key="thinking"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-primary"
                          >
                            <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse shrink-0" />
                            <span className="truncate">Analyzing...</span>
                          </motion.div>
                        )}

                        {currentStatus === "responding" && (
                          <motion.div
                            key="responding"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-accent-foreground"
                          >
                            <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin shrink-0" />
                            <span className="truncate">Requesting move...</span>
                          </motion.div>
                        )}

                        {currentStatus === "idle" && latestMessage && (
                          <motion.div
                            key={`response-${latestMessage.timestamp}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[9px] sm:text-[10px] font-mono text-foreground break-words line-clamp-2"
                          >
                            {latestMessage.response}
                          </motion.div>
                        )}

                        {currentStatus === "idle" &&
                          !latestMessage &&
                          model.status === "waiting" && (
                            <motion.div
                              key="waiting"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[9px] sm:text-[10px] text-muted-foreground"
                            >
                              Waiting to start...
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {models.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground py-8">
                <p className="text-xs sm:text-sm">No models racing yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: ModelState["status"] }) {
  const config = {
    waiting: { label: "Wait", className: "bg-muted/50 text-muted-foreground" },
    racing: {
      label: "Race",
      className: "bg-primary/20 text-primary animate-pulse",
    },
    finished: {
      label: "✓",
      className: "bg-accent/20 text-accent-foreground font-semibold",
    },
    stuck: { label: "!", className: "bg-chart-3/20 text-chart-3" },
    timeout: { label: "⏱", className: "bg-destructive/20 text-destructive" },
  }[status];

  return (
    <span
      className={`px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium rounded shrink-0 ${config.className}`}
    >
      {config.label}
    </span>
  );
}
