/**
 * Model position markers component
 *
 * @module HeroModelMarkers
 */

import type { ModelState } from "@/types";
import { motion } from "motion/react";
import { memo } from "react";

interface HeroModelMarkersProps {
  models: ModelState[];
  gridWidth: number;
  gridHeight: number;
}

/**
 * Renders animated markers for each model's current position
 */
export const HeroModelMarkers = memo(function HeroModelMarkers({
  models,
  gridWidth,
  gridHeight,
}: HeroModelMarkersProps) {
  return (
    <>
      {models.map((model) => (
        <motion.div
          key={model.config.id}
          className="absolute rounded-full shadow-lg pointer-events-none z-20"
          style={{
            width: `calc(100% / ${gridWidth} * 0.7)`,
            height: `calc(100% / ${gridHeight} * 0.7)`,
            backgroundColor: model.config.color,
            boxShadow: `0 0 calc(100% / ${gridWidth} * 0.4) ${model.config.color}`,
          }}
          animate={{
            left: `calc(100% / ${gridWidth} * ${model.position.x} + 100% / ${gridWidth} * 0.15)`,
            top: `calc(100% / ${gridHeight} * ${model.position.y} + 100% / ${gridHeight} * 0.15)`,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              backgroundColor: model.config.color,
            }}
          />
          {model.status === "finished" && (
            <div className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white">
              ✓
            </div>
          )}
          {model.status === "stuck" && (
            <div className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white">
              !
            </div>
          )}
        </motion.div>
      ))}
    </>
  );
});
