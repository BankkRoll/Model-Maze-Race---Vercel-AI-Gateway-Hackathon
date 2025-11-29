/**
 * Model path visualization component
 *
 * @module HeroModelPaths
 */

import { generatePathD } from "./utils";
import type { ModelState } from "@/types";
import { memo } from "react";

interface HeroModelPathsProps {
  models: ModelState[];
  gridWidth: number;
  gridHeight: number;
}

/**
 * Renders paths taken by each model
 */
export const HeroModelPaths = memo(function HeroModelPaths({
  models,
  gridWidth,
  gridHeight,
}: HeroModelPathsProps) {
  return (
    <>
      {models.map((model, modelIndex) => {
        if (model.pathTaken.length < 2) return null;

        const totalOffset = 0.4;
        const offsetStep = totalOffset / (models.length - 1 || 1);
        const offsetX = (modelIndex - (models.length - 1) / 2) * offsetStep;
        const offsetY = (modelIndex - (models.length - 1) / 2) * offsetStep;
        const strokeWidth = Math.max(0.1, 0.6 / models.length);

        return (
          <svg
            key={`path-${model.config.id}`}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox={`0 0 ${gridWidth} ${gridHeight}`}
            preserveAspectRatio="none"
          >
            <g transform={`translate(${offsetX}, ${offsetY})`}>
              <path
                d={generatePathD(model.pathTaken, gridWidth, gridHeight)}
                stroke={model.config.color}
                strokeWidth={strokeWidth}
                fill="none"
                opacity="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        );
      })}
    </>
  );
});
