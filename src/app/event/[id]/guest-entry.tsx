"use client";

import Link from "next/link";
import { useState } from "react";
import { getStoredGuestName, setGuestName } from "@/lib/guest-session";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function GuestEntry({ eventSlug }: { eventSlug: string }) {
  // Lazily read the saved name. It resolves to "" on the server and the stored
  // value on the client; suppressHydrationWarning reconciles that first paint.
  const [name, setName] = useState(getStoredGuestName);

  const handleChange = (value: string) => {
    setName(value);
    setGuestName(value);
  };

  const hasName = name.trim().length > 0;

  return (
    <div className="w-full max-w-sm self-center px-5 pb-8">
      <label htmlFor="guest-name" className="sr-only">
        Your name
      </label>
      <input
        id="guest-name"
        type="text"
        value={name}
        suppressHydrationWarning
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Your name"
        maxLength={40}
        autoComplete="name"
        autoCorrect="off"
        enterKeyHint="go"
        className="mb-3 block w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3.5 text-center text-[15px] font-medium tracking-tight text-white placeholder:font-light placeholder:text-white/30 backdrop-blur-md focus:border-white/25 focus:outline-none"
        style={{
          borderWidth: "0.5px",
          WebkitBackdropFilter: "blur(10px)",
          transition: `border-color 200ms ${EASE}`,
        }}
      />

      <Link
        href={`/event/${encodeURIComponent(eventSlug)}/camera`}
        prefetch
        className="flex h-14 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-base font-medium tracking-tight text-white transition-opacity active:opacity-80"
        style={{
          borderWidth: "0.5px",
          transitionDuration: "200ms",
          transitionTimingFunction: EASE,
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-white/90"
          />
          Enter Camera
        </span>
      </Link>

      <p className="mt-4 text-center text-[11px] uppercase tracking-[0.24em] text-white/30">
        {hasName ? "Tap to start shooting" : "Add your name so others know your shots"}
      </p>
    </div>
  );
}
