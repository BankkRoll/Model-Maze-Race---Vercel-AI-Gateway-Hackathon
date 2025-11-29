"use client";

/**
 * Enhanced model selection interface with filtering, sorting, and detailed model info
 * Features:
 * - Advanced filtering (provider, capabilities, pricing)
 * - Multiple sort options (name, price, provider)
 * - Selected models sidebar with detail view
 * - Improved settings dialog
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { fetchAvailableModels } from "@/lib/ai";
import type { AvailableModel, ModelConfig } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Filter,
  Loader2,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ModelDetailPanel } from "./model-detail-panel";

interface ModelSelectorEnhancedProps {
  onModelsSelected: (models: ModelConfig[]) => void;
  onSelectionChange?: (selectedModels: AvailableModel[]) => void;
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

type SortOption = "name" | "price-low" | "price-high" | "provider";

export function ModelSelector({
  onModelsSelected,
  onSelectionChange,
  disabled,
  apiKey,
}: ModelSelectorEnhancedProps) {
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [showReasoningOnly, setShowReasoningOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [viewingModelIndex, setViewingModelIndex] = useState<number>(0);

  const MAX_MODELS = 10;

  useEffect(() => {
    async function loadModels() {
      setIsLoading(true);
      const models = await fetchAvailableModels(apiKey || undefined);
      setAvailableModels(models);
      setIsLoading(false);
    }
    loadModels();
  }, [apiKey]);

  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    availableModels.forEach((model) => {
      if (model.specification?.provider) {
        providerSet.add(model.specification.provider);
      }
    });
    return Array.from(providerSet).sort();
  }, [availableModels]);

  const selectedModels = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => availableModels.find((m) => m.id === id))
      .filter((m): m is AvailableModel => m !== undefined);
  }, [selectedIds, availableModels]);

  useEffect(() => {
    onSelectionChange?.(selectedModels);
  }, [selectedModels, onSelectionChange]);

  const currentViewingModel = selectedModels[viewingModelIndex] || null;

  useEffect(() => {
    if (
      selectedModels.length > 0 &&
      viewingModelIndex >= selectedModels.length
    ) {
      setViewingModelIndex(selectedModels.length - 1);
    }
  }, [selectedModels.length, viewingModelIndex]);

  const filteredAndSortedModels = useMemo(() => {
    let filtered = [...availableModels];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.id.toLowerCase().includes(query) ||
          model.description?.toLowerCase().includes(query) ||
          model.specification?.provider?.toLowerCase().includes(query),
      );
    }

    if (selectedProvider !== "all") {
      filtered = filtered.filter(
        (model) => model.specification?.provider === selectedProvider,
      );
    }

    if (showReasoningOnly) {
      filtered = filtered.filter(
        (model) => model.capabilities?.reasoning === true,
      );
    }

    if (minPrice) {
      const min = Number.parseFloat(minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter(
          (model) => (model.pricing?.input || 0) >= min,
        );
      }
    }

    if (maxPrice) {
      const max = Number.parseFloat(maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter(
          (model) => (model.pricing?.input || Infinity) <= max,
        );
      }
    }

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = a.pricing?.input || Infinity;
          const priceB = b.pricing?.input || Infinity;
          return priceA - priceB;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = a.pricing?.input || 0;
          const priceB = b.pricing?.input || 0;
          return priceB - priceA;
        });
        break;
      case "provider":
        filtered.sort((a, b) => {
          const providerA = a.specification?.provider || "";
          const providerB = b.specification?.provider || "";
          return providerA.localeCompare(providerB);
        });
        break;
    }

    return filtered;
  }, [
    availableModels,
    searchQuery,
    selectedProvider,
    showReasoningOnly,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const toggleModel = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (selectedModels.length > 1 && viewingModelIndex >= newSelected.size) {
        setViewingModelIndex(Math.max(0, newSelected.size - 1));
      }
    } else {
      if (newSelected.size >= MAX_MODELS) {
        return;
      }
      newSelected.add(id);
      const newModel = availableModels.find((m) => m.id === id);
      if (newModel) {
        const newIndex = Array.from(newSelected).indexOf(id);
        setViewingModelIndex(newIndex);
      }
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
        capabilities: model.capabilities,
      };
    });
    onModelsSelected(configs);
  };

  const formatPricing = (value: number | undefined): string => {
    if (value === undefined) return "N/A";
    if (value >= 0.01) return `$${value.toFixed(4)}`;
    if (value >= 0.001) return `$${value.toFixed(5)}`;
    return `$${value.toFixed(6)}`;
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 h-full min-h-[500px] sm:min-h-[600px]">
      <div className="lg:col-span-2">
        <Card className="p-3 sm:p-4 md:p-5 lg:p-6 bg-card/50 backdrop-blur-sm border-border/50 w-full h-full flex flex-col">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-start justify-between gap-2 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1 h-4 sm:h-5 bg-primary rounded-full flex-shrink-0" />
                  <span className="truncate">Select AI Models</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Choose 1-{MAX_MODELS} models to compete
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant="secondary"
                  className="text-xs sm:text-sm font-mono"
                >
                  {selectedIds.size}/{MAX_MODELS}
                </Badge>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Filter & Sort Models</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Search Models
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, ID, description, or provider..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Filter by Provider
                          </label>
                          <Select
                            value={selectedProvider}
                            onValueChange={setSelectedProvider}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Providers</SelectItem>
                              {providers.map((provider) => (
                                <SelectItem key={provider} value={provider}>
                                  {provider}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Sort By</label>
                          <Select
                            value={sortBy}
                            onValueChange={(v) => setSortBy(v as SortOption)}
                          >
                            <SelectTrigger className="w-full">
                              <ArrowUpDown className="w-4 h-4 mr-2" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Name (A-Z)</SelectItem>
                              <SelectItem value="price-low">
                                Price: Low to High
                              </SelectItem>
                              <SelectItem value="price-high">
                                Price: High to Low
                              </SelectItem>
                              <SelectItem value="provider">Provider</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="reasoning-only"
                            checked={showReasoningOnly}
                            onCheckedChange={(checked) =>
                              setShowReasoningOnly(checked === true)
                            }
                          />
                          <label
                            htmlFor="reasoning-only"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Show reasoning models only
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Min Price (per 1K tokens)
                            </label>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="0.0001"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Max Price (per 1K tokens)
                            </label>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="0.01"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 sm:h-10 text-sm"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="provider">Sort by Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-shrink-0">
              <ScrollArea className="h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] w-full">
                <div className="space-y-2 pr-3">
                  <AnimatePresence mode="popLayout">
                    {filteredAndSortedModels.map((model, index) => {
                      const isSelected = selectedIds.has(model.id);
                      const colorIndex = Array.from(selectedIds).indexOf(
                        model.id,
                      );
                      const color =
                        colorIndex >= 0 ? MODEL_COLORS[colorIndex] : undefined;
                      const canSelect =
                        isSelected || selectedIds.size < MAX_MODELS;

                      return (
                        <motion.div
                          key={model.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: Math.min(index * 0.02, 0.3) }}
                        >
                          <div
                            className={`
                              flex items-start gap-2 p-2 sm:p-3 rounded-lg border transition-all
                              ${canSelect ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                              ${
                                isSelected
                                  ? "border-primary/50 bg-primary/5 shadow-sm"
                                  : "border-border/50 bg-card/30 hover:border-border hover:bg-card/50"
                              }
                            `}
                            onClick={() => {
                              if (canSelect && !disabled) {
                                toggleModel(model.id);
                              }
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked && canSelect && !disabled) {
                                  toggleModel(model.id);
                                } else if (!checked) {
                                  toggleModel(model.id);
                                }
                              }}
                              disabled={disabled || !canSelect}
                              className="mt-0.5 sm:mt-1 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
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
                                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5 line-clamp-1 break-words">
                                  {model.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                {model.specification?.provider && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5"
                                  >
                                    {model.specification.provider}
                                  </Badge>
                                )}
                                {model.capabilities?.reasoning && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 border-primary/30 bg-primary/5 text-primary"
                                  >
                                    🧠 Reasoning
                                  </Badge>
                                )}
                                {model.pricing && (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                    {formatPricing(model.pricing.input)} / 1K
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {filteredAndSortedModels.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        No models found matching your filters
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 pt-2 border-t">
              <span className="truncate">
                Showing {filteredAndSortedModels.length} of{" "}
                {availableModels.length} models
              </span>
              {selectedIds.size === MAX_MODELS && (
                <span className="text-chart-3 text-[10px] sm:text-xs flex-shrink-0 ml-2">
                  Max selected
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="p-3 sm:p-4 md:p-5 lg:p-6 bg-card/50 backdrop-blur-sm border-border/50 w-full h-full flex flex-col">
          {selectedModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-2 sm:px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/30 flex items-center justify-center mb-3 sm:mb-4">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              </div>
              <p className="text-xs sm:text-sm font-medium mb-1">
                Start selecting models
              </p>
              <p className="text-[10px] sm:text-xs opacity-70 px-2">
                Click on models from the list to add them here
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0 gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  Selected ({selectedModels.length})
                </h3>
                {selectedModels.length > 1 && (
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 sm:h-7 sm:w-7"
                      onClick={() =>
                        setViewingModelIndex(
                          (prev) =>
                            (prev - 1 + selectedModels.length) %
                            selectedModels.length,
                        )
                      }
                    >
                      <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                    <span className="text-[10px] sm:text-xs text-muted-foreground min-w-[2.5ch] sm:min-w-[3ch] text-center">
                      {viewingModelIndex + 1}/{selectedModels.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 sm:h-7 sm:w-7"
                      onClick={() =>
                        setViewingModelIndex(
                          (prev) => (prev + 1) % selectedModels.length,
                        )
                      }
                    >
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <ScrollArea className="h-[250px] mb-3 sm:mb-4">
                <div className="space-y-1.5 sm:space-y-2 pr-2">
                  {selectedModels.map((model, index) => {
                    const color = MODEL_COLORS[index % MODEL_COLORS.length];
                    const isViewing = index === viewingModelIndex;
                    return (
                      <div
                        key={model.id}
                        onClick={() => setViewingModelIndex(index)}
                        className={`
                          w-full text-left p-2 sm:p-2.5 rounded-lg border transition-all cursor-pointer
                          ${
                            isViewing
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 bg-card/30 hover:border-border hover:bg-card/50"
                          }
                        `}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div
                            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 0 6px ${color}`,
                            }}
                          />
                          <span className="text-xs sm:text-sm font-medium text-foreground truncate flex-1">
                            {model.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleModel(model.id);
                            }}
                            className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                          >
                            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex-shrink-0 border-t pt-3 sm:pt-4">
                <div className="pr-3 sm:pr-4">
                  <ModelDetailPanel model={currentViewingModel} />
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
