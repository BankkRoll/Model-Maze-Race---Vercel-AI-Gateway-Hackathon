"use client";

/**
 * Model selection interface with multi-select capability
 * Fetches all available models from AI Gateway dynamically
 * Supports up to 10 concurrent racing models
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchAvailableModels } from "@/lib/ai";
import type { AvailableModel, ModelConfig } from "@/types";
import { Loader2, Search, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface ModelSelectorProps {
  onModelsSelected: (models: ModelConfig[]) => void;
  disabled?: boolean;
  apiKey?: string | null;
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

export function ModelSelector({
  onModelsSelected,
  disabled,
  apiKey,
}: ModelSelectorProps) {
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<AvailableModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const MAX_MODELS = 10;

  useEffect(() => {
    async function loadModels() {
      setIsLoading(true);
      const models = await fetchAvailableModels(apiKey || undefined);
      setAvailableModels(models);
      setFilteredModels(models);
      setIsLoading(false);
    }
    loadModels();
  }, [apiKey]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModels(availableModels);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availableModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query),
    );
    setFilteredModels(filtered);
  }, [searchQuery, availableModels]);

  const toggleModel = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= MAX_MODELS) {
        return;
      }
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleStart = () => {
    const selected = Array.from(selectedIds);
    const configs: ModelConfig[] = selected.map((id, index) => {
      const model = availableModels.find((m) => m.id === id)!;
      return {
        id,
        name: model.name,
        modelString: model.id,
        color: MODEL_COLORS[index % MODEL_COLORS.length],
      };
    });
    onModelsSelected(configs);
  };

  if (isLoading) {
    return (
      <Card className="p-6 sm:p-8 bg-card/50 backdrop-blur-sm border-border/50 w-full h-full">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Loading available models...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 md:p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-border/70 transition-colors w-full max-w-full overflow-x-hidden">
      <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-x-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="w-1 h-4 sm:h-5 bg-primary rounded-full flex-shrink-0" />
              <span className="truncate">Select AI Models</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Choose 1-{MAX_MODELS} models to compete
            </p>
          </div>
          <Badge
            variant="secondary"
            className="text-xs sm:text-sm font-mono flex-shrink-0"
          >
            {selectedIds.size}/{MAX_MODELS}
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm w-full"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg border border-border/30 w-full">
            {Array.from(selectedIds).map((id, index) => {
              const model = availableModels.find((m) => m.id === id);
              const color = MODEL_COLORS[index % MODEL_COLORS.length];
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="flex items-center gap-1 sm:gap-1.5 pr-1 pl-1.5 sm:pl-2 py-0.5 sm:py-1 text-xs flex-shrink-0"
                  style={{
                    borderColor: color,
                    backgroundColor: `${color}15`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}`,
                    }}
                  />
                  <span className="truncate max-w-[100px] sm:max-w-none">
                    {model?.name}
                  </span>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="w-full max-w-full overflow-hidden">
          <ScrollArea className="h-[280px] sm:h-[320px] md:h-[360px] w-full">
            <div className="space-y-1.5 sm:space-y-2 pr-2 sm:pr-3">
              <AnimatePresence mode="popLayout">
                {filteredModels.map((model, index) => {
                  const isSelected = selectedIds.has(model.id);
                  const colorIndex = Array.from(selectedIds).indexOf(model.id);
                  const color =
                    colorIndex >= 0 ? MODEL_COLORS[colorIndex] : undefined;
                  const canSelect = isSelected || selectedIds.size < MAX_MODELS;

                  return (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      className="w-full"
                    >
                      <label
                        className={`
                          flex items-start gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-lg border transition-all w-full
                          ${canSelect ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                          ${
                            isSelected
                              ? "border-primary/50 bg-primary/5 shadow-sm"
                              : "border-border/50 bg-card/30 hover:border-border hover:bg-card/50"
                          }
                        `}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleModel(model.id)}
                          disabled={disabled || !canSelect}
                          className="mt-0.5 sm:mt-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            {isSelected && color && (
                              <div
                                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: color,
                                  boxShadow: `0 0 8px ${color}`,
                                }}
                              />
                            )}
                            <span className="font-medium text-xs sm:text-sm text-foreground truncate">
                              {model.name}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground/80 font-mono mb-0.5 sm:mb-1 break-all">
                            {model.id}
                          </p>
                          {model.description && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1 mb-1 sm:mb-1.5 break-words">
                              {model.description}
                            </p>
                          )}
                          {model.pricing && (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 md:gap-3 text-[10px] sm:text-xs text-muted-foreground break-words">
                              <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                                <span className="font-medium">Input:</span>
                                <span className="font-mono">
                                  {formatPricing(model.pricing.input)}
                                </span>
                              </span>
                              <span className="text-muted-foreground/50 hidden sm:inline">
                                •
                              </span>
                              <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                                <span className="font-medium">Output:</span>
                                <span className="font-mono">
                                  {formatPricing(model.pricing.output)}
                                </span>
                              </span>
                              <span className="text-muted-foreground/50 text-[10px] sm:text-xs whitespace-nowrap">
                                /1K
                              </span>
                            </div>
                          )}
                        </div>
                      </label>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredModels.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    No models found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground px-1">
          <span className="truncate">
            Showing {filteredModels.length} of {availableModels.length} models
          </span>
          {selectedIds.size === MAX_MODELS && (
            <span className="text-chart-3 text-[10px] sm:text-xs ml-2 flex-shrink-0">
              Max selected
            </span>
          )}
        </div>

        <Button
          onClick={handleStart}
          disabled={disabled || selectedIds.size === 0}
          className="w-full h-9 sm:h-10 md:h-11 text-sm sm:text-base font-semibold"
          size="lg"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span className="truncate">
            Start Race with {selectedIds.size} Model
            {selectedIds.size !== 1 ? "s" : ""}
          </span>
        </Button>
      </div>
    </Card>
  );
}

/**
 * Format pricing value for display - handles numbers, strings, and undefined
 * Formats to a readable price per 1K tokens
 *
 * @param value - The pricing value (number, string, or undefined)
 * @returns Formatted price string
 */
function formatPricing(value: any): string {
  if (value === undefined || value === null) {
    return "N/A";
  }

  if (typeof value === "number") {
    if (value >= 0.01) {
      return `$${value.toFixed(4)}`;
    } else if (value >= 0.001) {
      return `$${value.toFixed(5)}`;
    } else {
      return `$${value.toFixed(6)}`;
    }
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!isNaN(parsed)) {
      if (parsed >= 0.01) {
        return `$${parsed.toFixed(4)}`;
      } else if (parsed >= 0.001) {
        return `$${parsed.toFixed(5)}`;
      } else {
        return `$${parsed.toFixed(6)}`;
      }
    }
    return `$${value}`;
  }

  return String(value);
}
