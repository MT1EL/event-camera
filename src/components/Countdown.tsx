"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string; // ISO string format passed from Server Component
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const target = new Date(targetDate).getTime();

    function updateTimer() {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const formatted = [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0"),
      ].join(":");

      setTimeLeft(formatted);
    }

    // Schedule the initial calculations onto the next event tick loop
    // This strictly avoids synchronous execution and cascading render loops
    const initialTimeout = setTimeout(updateTimer, 0);

    // Set up the persistent ticking engine interval loop
    const interval = setInterval(updateTimer, 1000);

    // Clean up all memory handlers on unmount
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [targetDate]);

  // Prevents Next.js hydration errors by rendering a skeleton matching server state first
  if (!isMounted) {
    return (
      <div
        className="flex flex-col items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center backdrop-blur-md"
        style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(10px)" }}
      >
        <div className="flex items-center gap-1.5 opacity-40">
          <div className="h-3.5 w-3.5 animate-pulse rounded bg-white/40" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            Loading Timer...
          </span>
        </div>
        <div className="font-mono text-2xl font-light tracking-widest text-white/20 tabular-nums animate-pulse">
          00:00:00
        </div>
        <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center backdrop-blur-md"
      style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(10px)" }}
    >
      <div className="flex items-center gap-1.5">
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-white/40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          Gallery Locked
        </span>
      </div>

      <div className="font-mono text-2xl font-light tracking-widest text-white/90 tabular-nums">
        {timeLeft}
      </div>

      <p className="text-[11px] font-light text-white/35">
        Photos are blurring safely. Revealing automatically at scheduled time.
      </p>
    </div>
  );
}
