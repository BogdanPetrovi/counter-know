import type { CSSProperties } from "react";

export function Typed({ text, delay: d }: { text: string; delay: number }) {
  return (
    <span
      className="type"
      style={
        {
          "--w": `${text.length}ch`,
          "--steps": `steps(${text.length})`,
          "--d": `${d}s`,
        } as CSSProperties
      }
    >
      {text}
    </span>
  );
}
