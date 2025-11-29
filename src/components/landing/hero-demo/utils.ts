/**
 * Utility functions for hero demo component
 *
 * @module HeroDemoUtils
 */

import type { Direction, Position } from "@/types";

/**
 * Calculate new position based on direction
 *
 * @param pos - Current position
 * @param direction - Direction to move
 * @returns New position after moving
 */
export function calculateNewPosition(
  pos: Position,
  direction: Direction,
): Position {
  switch (direction) {
    case "up":
      return { x: pos.x, y: pos.y - 1 };
    case "down":
      return { x: pos.x, y: pos.y + 1 };
    case "left":
      return { x: pos.x - 1, y: pos.y };
    case "right":
      return { x: pos.x + 1, y: pos.y };
  }
}

/**
 * Generate SVG path d attribute from positions
 *
 * @param positions - Array of positions to create path from
 * @param gridWidth - Width of the grid
 * @param gridHeight - Height of the grid
 * @returns SVG path d attribute string
 */
export function generatePathD(
  positions: Position[],
  gridWidth: number,
  gridHeight: number,
): string {
  if (positions.length === 0) return "";

  const commands: string[] = [];
  positions.forEach((pos, i) => {
    const x = pos.x + 0.5;
    const y = pos.y + 0.5;
    commands.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  });

  return commands.join(" ");
}
