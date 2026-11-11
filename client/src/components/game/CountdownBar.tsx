"use client";

import { useState } from "react";

export interface CountdownBarProps {
  deadline: number;
  durationMs: number;
  warn: boolean;
  className?: string;
}

export function CountdownBar({ deadline, durationMs, warn, className = "" }: CountdownBarProps) {
  const [elapsedAtMount] = useState(() => Math.max(0, durationMs - (deadline - Date.now())));

  return (
    <div className={`overflow-hidden bg-navy-700 ${className}`}>
      <div
        className={`timer-bar h-full ${warn ? "bg-danger" : "bg-gold"}`}
        style={{
          animationDuration: `${durationMs}ms`,
          animationDelay: `-${elapsedAtMount}ms`,
        }}
      />
    </div>
  );
}
