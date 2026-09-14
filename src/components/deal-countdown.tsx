"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function remaining(endsAt: number) {
  const ms = Math.max(0, endsAt - Date.now());
  return {
    ms,
    h: Math.floor(ms / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Ticking deal timer.
 *
 * The end time is computed on the server and passed as a millisecond stamp,
 * so the first paint is correct and only the ticking needs the client. Until
 * the first tick lands it renders the server's value, which avoids the
 * hydration mismatch a `Date.now()` in render would cause.
 */
export function DealCountdown({
  endsAt,
  className,
  compact = false,
}: {
  endsAt: number;
  className?: string;
  compact?: boolean;
}) {
  const [time, setTime] = useState(() => remaining(endsAt));

  useEffect(() => {
    const id = setInterval(() => setTime(remaining(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (time.ms <= 0) {
    return (
      <span className={cn("text-xs font-semibold text-fg-subtle", className)}>
        Deal ended
      </span>
    );
  }

  const urgent = time.ms < 3_600_000;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
        urgent ? "text-price" : "text-fg-muted",
        className,
      )}
    >
      <Clock size={12} className={urgent ? "animate-pulse" : undefined} />
      {compact ? "" : "Ends in "}
      {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
    </span>
  );
}
