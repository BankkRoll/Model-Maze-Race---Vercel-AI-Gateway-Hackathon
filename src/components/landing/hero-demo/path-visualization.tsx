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

  const shortestLength = allPaths[0]?.length || Infinity;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox={`0 0 ${gridWidth} ${gridHeight}`}
      preserveAspectRatio="none"
    >
      {allPaths.map((path, pathIndex) => {
        const pathLength = path.length;
        const isShortest = pathIndex === 0;
        const isShort = pathLength <= shortestLength * 1.2;
        const isMedium = pathLength <= shortestLength * 1.5;

        let strokeColor = "var(--chart-3)";
        let strokeWidth = "0.15";
        let opacity = "0.5";
        let dashArray = "0.3 0.3";

        if (isShortest) {
          strokeColor = "var(--chart-1)";
          strokeWidth = "0.2";
          opacity = "0.8";
          dashArray = "none";
        } else if (isShort) {
          strokeColor = "var(--chart-2)";
          strokeWidth = "0.15";
          opacity = "0.6";
          dashArray = "0.2 0.2";
        } else if (isMedium) {
          strokeColor = "var(--chart-3)";
          strokeWidth = "0.12";
          opacity = "0.4";
          dashArray = "0.15 0.25";
        } else {
          strokeColor = "var(--chart-4)";
          strokeWidth = "0.1";
          opacity = "0.25";
          dashArray = "0.1 0.3";
        }

        return (
          <path
            key={`path-${pathIndex}`}
            d={generatePathD(path, gridWidth, gridHeight)}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={dashArray}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
});
