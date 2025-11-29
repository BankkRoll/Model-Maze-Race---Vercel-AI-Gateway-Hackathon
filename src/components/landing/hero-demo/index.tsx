/**
 * Hero demo component - shows a mini simulation of the maze race
 *
 * @module HeroDemo
 */

import { RaceHUD } from "@/components/game/race-hud";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { HeroMazeGrid } from "./maze-grid";
import { HeroModelMarkers } from "./model-markers";
import { HeroModelPaths } from "./model-paths";
import { HeroPathVisualization } from "./path-visualization";
import { useHeroMaze } from "./use-hero-maze";
import { useHeroSimulation } from "./use-hero-simulation";

interface HeroDemoProps {
  className?: string;
  debugMode?: boolean;
}

/**
 * Demo component showing a mini maze race simulation
 *
 * @param props - Component props
 * @param props.className - Optional CSS classes
 * @param props.debugMode - Whether to show debug information
 * @returns The demo component
 */
function HeroDemoComponent({ className, debugMode = false }: HeroDemoProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const prevMazeRef = useRef<string | null>(null);

  const {
    demoMaze,
    startPos,
    exitPos,
    demoModels: initialModels,
    allPaths,
    reachableCells,
    regenerateMaze,
  } = useHeroMaze(debugMode);

  const { models, chatMessages, modelStatuses, resetRace } = useHeroSimulation({
    demoMaze,
    startPos,
    exitPos,
    demoModels: initialModels,
    isPlaying,
  });

  useEffect(() => {
    if (!demoMaze || !startPos) return;

    const mazeKey = `${startPos?.x},${startPos?.y}-${exitPos?.x},${exitPos?.y}`;

    if (prevMazeRef.current !== null && prevMazeRef.current !== mazeKey) {
      // Maze changed - simulation hook will handle updating models
    }

    prevMazeRef.current = mazeKey;
  }, [demoMaze, startPos, exitPos]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    resetRace();
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  }, [resetRace]);

  const handleRegenerate = useCallback(() => {
    regenerateMaze();
  }, [regenerateMaze]);

  if (!demoMaze || !startPos || !exitPos) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const width = demoMaze[0].length;
  const height = demoMaze.length;

  return (
    <div className={`w-full ${className}`}>
      <div className="grid lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-7xl mx-auto px-2 sm:px-3 md:px-4">
        <div className="lg:col-span-2 flex items-center justify-center p-1 sm:p-2 md:p-4 min-w-0 overflow-hidden">
          <div className="relative rounded-lg overflow-hidden border-2 border-border/50 shadow-xl bg-background/50 backdrop-blur-sm w-full">
            <div
              className="relative w-full"
              style={{
                aspectRatio: `${width} / ${height}`,
              }}
            >
              <div className="absolute inset-0 w-full h-full">
                <HeroMazeGrid
                  maze={demoMaze}
                  startPos={startPos}
                  exitPos={exitPos}
                  reachableCells={reachableCells}
                  debugMode={debugMode}
                />

                {debugMode && (
                  <HeroPathVisualization
                    allPaths={allPaths}
                    gridWidth={width}
                    gridHeight={height}
                  />
                )}

                <HeroModelPaths
                  models={models}
                  gridWidth={width}
                  gridHeight={height}
                />

                <HeroModelMarkers
                  models={models}
                  gridWidth={width}
                  gridHeight={height}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 w-full min-w-0">
          <div className="h-[350px] xs:h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] w-full">
            <RaceHUD
              models={models}
              currentStep={Math.max(...models.map((m) => m.stepCount), 0)}
              maxTurns={100}
              chatMessages={chatMessages}
              modelStatuses={modelStatuses}
              isRunning={isPlaying}
              isPaused={false}
              onStartRace={() => setIsPlaying(true)}
              onPauseRace={() => setIsPlaying(false)}
              onResumeRace={() => setIsPlaying(true)}
              onStopRace={() => setIsPlaying(false)}
              onReset={handleReset}
              onRegenerateMaze={handleRegenerate}
              hideControlButtons={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const HeroDemo = memo(HeroDemoComponent);
