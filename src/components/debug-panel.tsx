"use client";

/**
 * Debug panel showing AI prompts and responses
 */

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DebugInfo } from "@/types";
import { formatVisibleAreaForPrompt } from "@/lib/maze";

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
                        Visible Area:
                      </div>
                      <pre className="text-xs font-mono bg-background/50 p-2 rounded overflow-x-auto text-foreground">
                        {formatVisibleAreaForPrompt(log.visibleArea)}
                      </pre>
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
