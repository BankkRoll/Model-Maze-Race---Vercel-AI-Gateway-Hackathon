/**
 * Path visualization component for debug mode
 *
 * @module HeroPathVisualization
 */

import type { Position } from "@/types";
import { memo } from "react";
import { generatePathD } from "./utils";

interface HeroPathVisualizationProps {
  allPaths: Position[][];
  gridWidth: number;
  gridHeight: number;
}

/**
 * Renders all possible paths in debug mode
 */
export const HeroPathVisualization = memo(function HeroPathVisualization({
  allPaths,
  gridWidth,
  gridHeight,
}: HeroPathVisualizationProps) {
  if (allPaths.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox={`0 0 ${gridWidth} ${gridHeight}`}
      preserveAspectRatio="none"
    >
      {allPaths.map((path, pathIndex) => (
        <path
          key={`path-${pathIndex}`}
          d={generatePathD(path, gridWidth, gridHeight)}
          stroke="#a855f7"
          strokeWidth="0.05"
          fill="none"
          strokeDasharray="0.3 0.3"
          opacity="0.6"
        />
      ))}
    </svg>
  );
});
