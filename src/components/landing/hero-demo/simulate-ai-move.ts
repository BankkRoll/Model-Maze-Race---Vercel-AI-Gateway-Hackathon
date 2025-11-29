/**
 * AI move simulation for hero demo
 *
 * @module SimulateAIMove
 */

import {
  countVisits,
  detectLoop,
  getUnexploredDirections,
  getVisibleArea,
  isValidMove,
} from "@/lib/maze";
import type { Direction, MazeGrid, ModelState, Position } from "@/types";
import { calculateNewPosition } from "./utils";

/**
 * Simulate AI move with smart path tracking
 *
 * @param model - Current model state
 * @param maze - The maze grid
 * @param exitPos - Exit position
 * @returns Direction and response text
 */
export function simulateAIMove(
  model: ModelState,
  maze: MazeGrid,
  exitPos: Position,
): { direction: Direction | null; response: string } {
  if (!maze || !exitPos) return { direction: null, response: "Error" };

  const visible = getVisibleArea(maze, model.position);
  const directions: Direction[] = ["up", "down", "left", "right"];
  const moveHistory = model.moveHistory.map((m) => m.direction);
  const hasLoop = detectLoop(moveHistory, 8);
  const unexplored = getUnexploredDirections(
    model.position,
    model.pathTaken,
    visible,
  );

  const validMoves: {
    dir: Direction;
    pos: Position;
    dist: number;
    visitCount: number;
    isUnexplored: boolean;
    score: number;
  }[] = [];

  for (const dir of directions) {
    const newPos = calculateNewPosition(model.position, dir);
    if (isValidMove(maze, newPos)) {
      const dist =
        Math.abs(newPos.x - exitPos.x) + Math.abs(newPos.y - exitPos.y);
      const visitCount = countVisits(model.pathTaken, newPos);
      const isUnexplored = unexplored.includes(dir);

      let score = dist;

      if (isUnexplored) {
        score -= 10;
      }

      if (visitCount > 0) {
        score += visitCount * 3;
      }

      if (hasLoop && moveHistory.length >= 2) {
        const lastTwo = moveHistory.slice(-2);
        if (lastTwo.includes(dir)) {
          score += 15;
        }
      }

      score += (Math.random() - 0.5) * 0.5;

      validMoves.push({
        dir,
        pos: newPos,
        dist,
        visitCount,
        isUnexplored,
        score,
      });
    }
  }

  if (validMoves.length === 0) {
    return { direction: null, response: "No valid moves available" };
  }

  validMoves.sort((a, b) => a.score - b.score);
  const chosen = validMoves[0];

  let response: string;
  if (chosen.isUnexplored) {
    const responses = [
      chosen.dir,
      `Exploring ${chosen.dir} (new area)`,
      `Going ${chosen.dir} - haven't been here yet`,
      `${chosen.dir.toUpperCase()} - unexplored`,
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  } else if (chosen.visitCount > 1) {
    const responses = [
      chosen.dir,
      `Backtracking ${chosen.dir}`,
      `Returning ${chosen.dir} (visited ${chosen.visitCount}x)`,
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  } else if (hasLoop) {
    const responses = [
      chosen.dir,
      `Breaking loop, going ${chosen.dir}`,
      `${chosen.dir} - avoiding repetition`,
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  } else {
    const responses = [
      chosen.dir,
      `Moving ${chosen.dir}`,
      `I'll go ${chosen.dir}`,
      chosen.dir.toUpperCase(),
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  }

  return {
    direction: chosen.dir,
    response,
  };
}
