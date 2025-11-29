"use client";

/**
 * Race preview card - Step 3
 * Compact duelist-style racer lineup with launch button
 *
 * @module RacePreviewCard
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AvailableModel, ModelConfig } from "@/types";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";

interface RacePreviewCardProps {
  selectedModels: AvailableModel[];
  onStart: (models: ModelConfig[]) => void;
  disabled?: boolean;
}

const MODEL_COLORS = [
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#f97316", // orange
  "#3b82f6", // blue
  "#ef4444", // red
  "#14b8a6", // teal
  "#a855f7", // purple
];

export function RacePreviewCard({
  selectedModels,
  onStart,
  disabled,
}: RacePreviewCardProps) {
  const handleStart = () => {
    const configs: ModelConfig[] = selectedModels.map((model, index) => ({
      id: model.id,
      name: model.name,
      modelString: model.id,
      color: MODEL_COLORS[index % MODEL_COLORS.length],
      capabilities: model.capabilities,
    }));
    onStart(configs);
  };

  return (
    <Card className="p-3 sm:p-4 md:p-5 bg-card/50 backdrop-blur-sm border-border/50 w-full">
      <div className="space-y-3 sm:space-y-4">
        {selectedModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center text-muted-foreground">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/30 flex items-center justify-center mb-3 sm:mb-4">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
            </div>
            <p className="text-xs sm:text-sm font-medium mb-1">
              No racers selected
            </p>
            <p className="text-[10px] sm:text-xs opacity-70 px-2">
              Select models in Step 2 to preview them here
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {selectedModels.map((model, index) => {
                const color = MODEL_COLORS[index % MODEL_COLORS.length];
                return (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative p-2 sm:p-2.5 rounded-lg border border-border/50 bg-card/30 hover:border-border/70 hover:bg-card/50 transition-all group"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: color,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 8px ${color}`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h5 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {model.name}
                          </h5>
                          {model.capabilities?.reasoning && (
                            <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                          )}
                        </div>
                        {model.specification?.provider && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 leading-none"
                          >
                            {model.specification.provider}
                          </Badge>
                        )}
                      </div>
                      <div
                        className="text-[10px] sm:text-xs font-bold text-muted-foreground/60 flex-shrink-0"
                        style={{ color }}
                      >
                        #{index + 1}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        <div className="pt-2 sm:pt-3 border-t">
          <Button
            onClick={handleStart}
            disabled={disabled || selectedModels.length === 0}
            className="w-full h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base font-semibold"
            size="lg"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="truncate">Launch Race</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
