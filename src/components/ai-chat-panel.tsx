"use client";

/**
 * Live AI chat panel showing real-time thinking and responses
 */

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AIChatMessage, AIStatus, ModelState } from "@/types";
import { Brain, Loader2, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

interface AIChatPanelProps {
  models: ModelState[];
  chatMessages: AIChatMessage[];
  modelStatuses: Record<string, AIStatus>;
}

export function AIChatPanel({
  models,
  chatMessages,
  modelStatuses,
}: AIChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 h-[600px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Live AI Chat</h3>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-3 pr-4">
          {models.map((model) => (
            <ModelChatSection
              key={model.config.id}
              model={model}
              messages={chatMessages.filter(
                (msg) => msg.modelId === model.config.id,
              )}
              currentStatus={modelStatuses[model.config.id] || "idle"}
            />
          ))}

          {models.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground py-12">
              <p className="text-sm">No models racing yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

interface ModelChatSectionProps {
  model: ModelState;
  messages: AIChatMessage[];
  currentStatus: AIStatus;
}

function ModelChatSection({
  model,
  messages,
  currentStatus,
}: ModelChatSectionProps) {
  const latestMessage = messages[messages.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border/50 rounded-lg p-3 bg-background/30"
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-3 h-3 rounded-full shadow-lg shrink-0"
          style={{
            backgroundColor: model.config.color,
            boxShadow: `0 0 10px ${model.config.color}`,
          }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {model.config.name}
          </h4>
        </div>
        <StatusIndicator status={currentStatus} />
      </div>

      <AnimatePresence mode="wait">
        {currentStatus === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-primary py-2"
          >
            <Brain className="w-4 h-4 animate-pulse" />
            <span>Analyzing maze...</span>
          </motion.div>
        )}

        {currentStatus === "responding" && (
          <motion.div
            key="responding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-accent-foreground py-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Requesting move from AI...</span>
          </motion.div>
        )}

        {currentStatus === "idle" && latestMessage && (
          <motion.div
            key={`response-${latestMessage.timestamp}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-2"
          >
            <div className="text-xs text-muted-foreground mb-1">
              Step {latestMessage.stepNumber}:
            </div>
            <div className="text-sm font-mono bg-muted/30 rounded px-2 py-1.5 text-foreground break-words">
              {latestMessage.response}
            </div>
          </motion.div>
        )}

        {currentStatus === "idle" &&
          !latestMessage &&
          model.status === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground py-2"
            >
              Waiting to start...
            </motion.div>
          )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/30">
        <div className="text-xs">
          <span className="text-muted-foreground">Steps: </span>
          <span className="font-mono font-semibold text-foreground">
            {model.stepCount}
          </span>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Time: </span>
          <span className="font-mono font-semibold text-foreground">
            {(model.totalTime / 1000).toFixed(1)}s
          </span>
        </div>
        <div className="flex-1" />
        <ModelStatusBadge status={model.status} />
      </div>
    </motion.div>
  );
}

function StatusIndicator({ status }: { status: AIStatus }) {
  if (status === "thinking") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-medium">Thinking</span>
      </div>
    );
  }

  if (status === "responding") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-accent-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="font-medium">Responding</span>
      </div>
    );
  }

  return null;
}

function ModelStatusBadge({ status }: { status: ModelState["status"] }) {
  const config = {
    waiting: {
      label: "Waiting",
      className: "bg-muted/50 text-muted-foreground",
    },
    racing: { label: "Racing", className: "bg-primary/20 text-primary" },
    finished: {
      label: "✓ Finished",
      className: "bg-accent/20 text-accent-foreground font-semibold",
    },
    stuck: { label: "Stuck", className: "bg-chart-3/20 text-chart-3" },
    timeout: {
      label: "Timeout",
      className: "bg-destructive/20 text-destructive",
    },
  }[status];

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
