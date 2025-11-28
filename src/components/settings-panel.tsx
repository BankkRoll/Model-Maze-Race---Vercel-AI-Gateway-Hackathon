"use client";

/**
 * Settings panel for configuring race parameters
 * Settings apply instantly without needing an "Apply" button
 */

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { MazeConfig } from "@/types";
import { useEffect, useState } from "react";

interface SettingsPanelProps {
  onConfigChange: (config: MazeConfig) => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export function SettingsPanel({
  onConfigChange,
  onSpeedChange,
  disabled = false,
}: SettingsPanelProps) {
  const [size, setSize] = useState<"small" | "medium" | "large" | "huge">(
    "medium",
  );
  const [difficulty, setDifficulty] =
    useState<MazeConfig["difficulty"]>("medium");
  const [speed, setSpeed] = useState(1);

  const sizeMap = {
    small: { width: 15, height: 15 },
    medium: { width: 25, height: 25 },
    large: { width: 35, height: 35 },
    huge: { width: 45, height: 45 },
  };

  useEffect(() => {
    const dimensions = sizeMap[size];
    onConfigChange({
      ...dimensions,
      difficulty,
    });
  }, [size, difficulty]);

  useEffect(() => {
    onSpeedChange(speed);
  }, [speed]);

  return (
    <Card className="p-4 sm:p-5 md:p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-border/70 transition-colors w-full h-full">
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground flex items-center gap-2">
        <span className="w-1 h-4 sm:h-5 bg-primary rounded-full flex-shrink-0" />
        <span className="truncate">Maze Configuration</span>
      </h2>

      <div className="space-y-4 sm:space-y-5 md:space-y-6">
        <div className="space-y-1.5 sm:space-y-2">
          <Label
            htmlFor="size"
            className="text-foreground font-medium text-sm sm:text-base"
          >
            Maze Size
          </Label>
          <Select
            value={size}
            onValueChange={(v) => setSize(v as typeof size)}
            disabled={disabled}
          >
            <SelectTrigger id="size" className="h-9 sm:h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (15×15)</SelectItem>
              <SelectItem value="medium">Medium (25×25)</SelectItem>
              <SelectItem value="large">Large (35×35)</SelectItem>
              <SelectItem value="huge">Huge (45×45)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Grid dimensions for the maze
          </p>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label
            htmlFor="difficulty"
            className="text-foreground font-medium text-sm sm:text-base"
          >
            Difficulty
          </Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as MazeConfig["difficulty"])}
            disabled={disabled}
          >
            <SelectTrigger id="difficulty" className="h-9 sm:h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy - More paths</SelectItem>
              <SelectItem value="medium">Medium - Balanced</SelectItem>
              <SelectItem value="hard">Hard - Few paths</SelectItem>
              <SelectItem value="expert">Expert - Minimal paths</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Controls path complexity
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="speed"
              className="text-foreground font-medium text-sm sm:text-base"
            >
              Race Speed
            </Label>
            <span className="text-xs sm:text-sm font-mono font-semibold text-primary">
              {speed}x
            </span>
          </div>
          <Slider
            id="speed"
            min={1}
            max={10}
            step={1}
            value={[speed]}
            onValueChange={([v]) => setSpeed(v)}
            disabled={disabled}
            className="cursor-pointer w-full"
          />
          <p className="text-xs text-muted-foreground">
            Adjust model movement speed
          </p>
        </div>
      </div>
    </Card>
  );
}
