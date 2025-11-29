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
      {models.map((model, modelIndex) => {
        const trailEnd =
          model.pathTaken.length > 0
            ? model.pathTaken[model.pathTaken.length - 1]
            : model.position;

        const cellWidth = 100 / gridWidth;
        const cellHeight = 100 / gridHeight;
        const totalOffset = cellWidth * 0.3;
        const offsetStep =
          models.length > 1 ? totalOffset / (models.length - 1) : 0;
        const offsetX = (modelIndex - (models.length - 1) / 2) * offsetStep;
        const offsetY = (modelIndex - (models.length - 1) / 2) * offsetStep;

        return (
          <motion.div
            key={model.config.id}
            className="absolute rounded-full shadow-lg pointer-events-none z-20"
            style={{
              width: `calc(100% / ${gridWidth} * 0.5)`,
              height: `calc(100% / ${gridHeight} * 0.5)`,
              backgroundColor: model.config.color,
              boxShadow: `0 0 calc(100% / ${gridWidth} * 0.3) ${model.config.color}`,
            }}
            animate={{
              left: `calc(100% / ${gridWidth} * ${trailEnd.x} + 100% / ${gridWidth} * 0.25 + ${offsetX}%)`,
              top: `calc(100% / ${gridHeight} * ${trailEnd.y} + 100% / ${gridHeight} * 0.25 + ${offsetY}%)`,
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
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                ✓
              </div>
            )}
            {model.status === "stuck" && (
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                !
              </div>
            )}
          </motion.div>
        );
      })}
    </>
  );
});
