"use client";

/**
 * Detailed model information panel
 * Shows comprehensive model data including capabilities, pricing, and specifications
 *
 * @module ModelDetailPanel
 */

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AvailableModel } from "@/types";
import { Brain, DollarSign, Info } from "lucide-react";

interface ModelDetailPanelProps {
  model: AvailableModel | null;
}

export function ModelDetailPanel({ model }: ModelDetailPanelProps) {
  if (!model) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">Select a model to view details</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price < 0.001) {
      return `$${(price * 1000).toFixed(3)}`;
    }
    return `$${price.toFixed(3)}`;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 truncate">
            {model.name}
          </h3>
          {model.specification?.provider && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {model.specification.provider}
            </p>
          )}
        </div>
      </div>

      {model.description && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 break-words">
          {model.description}
        </p>
      )}

      <div className="space-y-2.5 sm:space-y-3">
        <div>
          <h4 className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 sm:mb-2">
            Capabilities
          </h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {model.capabilities?.reasoning && (
              <Badge
                variant="outline"
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border-primary/30 bg-primary/5 text-primary"
              >
                <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                Reasoning
              </Badge>
            )}
            {model.specification?.provider && (
              <Badge
                variant="outline"
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border-border/50"
              >
                {model.specification.provider}
              </Badge>
            )}
            {model.modelType && (
              <Badge
                variant="outline"
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border-border/50"
              >
                {model.modelType}
              </Badge>
            )}
          </div>
        </div>

        {model.pricing && (
          <>
            <Separator />
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-1.5">
                <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Cost (per 1M tokens)
              </h4>
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Input:
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono font-semibold text-foreground">
                    {formatPrice(model.pricing.input)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Output:
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono font-semibold text-foreground">
                    {formatPrice(model.pricing.output)}
                  </span>
                </div>
                {model.pricing.cachedInputTokens && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      Cached input:
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono font-semibold text-foreground">
                      {formatPrice(model.pricing.cachedInputTokens)}
                    </span>
                  </div>
                )}
                {model.pricing.cacheCreationInputTokens && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      Cache creation:
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono font-semibold text-foreground">
                      {formatPrice(model.pricing.cacheCreationInputTokens)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {model.specification && (
          <>
            <Separator />
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-1.5">
                <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Specification
              </h4>
              <div className="space-y-1 sm:space-y-1.5">
                {model.specification.provider && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      Provider:
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-foreground">
                      {model.specification.provider}
                    </span>
                  </div>
                )}
                {model.specification.modelId && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                      Model ID:
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-foreground break-all text-right">
                      {model.specification.modelId}
                    </span>
                  </div>
                )}
                {model.specification.specificationVersion && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      Version:
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-foreground">
                      {model.specification.specificationVersion}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="pt-2 sm:pt-3 border-t">
          <div className="text-[9px] sm:text-[10px] text-muted-foreground font-mono break-all">
            {model.id}
          </div>
        </div>
      </div>
    </div>
  );
}
