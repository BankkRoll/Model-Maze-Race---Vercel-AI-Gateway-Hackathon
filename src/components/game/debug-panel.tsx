"use client";

/**
 * Debug panel showing AI prompts and responses
 * Only visible when debug mode is enabled
 * Enhanced to show all paths, valid moves, and unexplored directions
 *
 * @module DebugPanel
 */

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatVisibleAreaForPrompt } from "@/lib/maze";
import type { DebugInfo } from "@/types";
import { motion } from "motion/react";

interface DebugPanelProps {
  logs: DebugInfo[];
  visible?: boolean;
}

export function DebugPanel({ logs, visible = true }: DebugPanelProps) {
  if (!visible || logs.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full"
    >
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Debug Logs
        </h3>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {logs
              .slice(-20)
              .reverse()
              .map((log, index) => (
                <div
                  key={`${log.modelId}-${log.step}-${index}`}
                  className="p-3 bg-muted/30 rounded-lg border border-border/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">
                      {log.modelId} - Step {log.step}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        Position:
                      </div>
                      <div className="text-xs font-mono text-foreground">
                        ({log.position.x}, {log.position.y})
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        Visible Area:
                      </div>
                      <pre className="text-xs font-mono bg-background/50 p-2 rounded overflow-x-auto text-foreground">
                        {formatVisibleAreaForPrompt(
                          log.visibleArea,
                          log.pathTaken,
                          log.position,
                        )}
                      </pre>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        Valid Moves ({log.validMoves.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {log.validMoves.length > 0 ? (
                          log.validMoves.map((move) => (
                            <Badge
                              key={move}
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {move}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            None (stuck!)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        Unexplored Directions ({log.unexploredDirections.length}
                        ):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {log.unexploredDirections.length > 0 ? (
                          log.unexploredDirections.map((dir) => (
                            <Badge
                              key={dir}
                              variant="secondary"
                              className="text-xs font-mono bg-chart-2/20"
                            >
                              {dir}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            All directions explored
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        Path Taken ({log.pathTaken.length} steps):
                      </div>
                      <div className="text-xs font-mono bg-background/50 p-2 rounded overflow-x-auto text-foreground max-h-32 overflow-y-auto">
                        {log.pathTaken.length > 0 ? (
                          <div className="space-y-0.5">
                            {log.pathTaken.map((pos, idx) => (
                              <div
                                key={`${pos.x}-${pos.y}-${idx}`}
                                className={
                                  idx === log.pathTaken.length - 1
                                    ? "text-primary font-semibold"
                                    : idx === 0
                                      ? "text-chart-1"
                                      : ""
                                }
                              >
                                {idx === 0 && "START "}
                                Step {idx}: ({pos.x}, {pos.y})
                                {idx === log.pathTaken.length - 1 &&
                                  " ← CURRENT"}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No path yet
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        Response:
                      </div>
                      <pre className="text-xs font-mono bg-background/50 p-2 rounded overflow-x-auto text-primary">
                        {log.response}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </Card>
    </motion.div>
  );
}
