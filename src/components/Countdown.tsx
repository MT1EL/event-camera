"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("00:00:00");

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    function updateTimer() {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        [
          String(hours).padStart(2, "0"),
          String(minutes).padStart(2, "0"),
          String(seconds).padStart(2, "0"),
        ].join(":"),
      );
    }

    updateTimer(); // initial run
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div
      className="flex flex-col items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center backdrop-blur-md"
      style={{
        borderWidth: "0.5px",
        WebkitBackdropFilter: "blur(10px)",
      }}
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
