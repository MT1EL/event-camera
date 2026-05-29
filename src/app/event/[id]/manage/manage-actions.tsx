"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import QRSheet from "./qr-sheet";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const FEEDBACK_MS = 1400;

export default function ManageActions({
  eventId,
  eventName,
  absolute,
  display,
  qrSvg,
}: {
  eventId: string;
  eventName: string;
  absolute: string;
  display: string;
  qrSvg: string;
}) {
  const [saved, setSaved] = useState(false);

  const handleDownload = useCallback(() => {
    if (saved) return;
    // Phase 2: trigger ZIP download from the backend. Prototype: visual feedback.
    setSaved(true);
    window.setTimeout(() => setSaved(false), FEEDBACK_MS);
  }, [saved]);

  return (
    <div className="flex gap-3">
      <Link
        href={`/event/${encodeURIComponent(eventId)}/camera`}
        aria-label="Open camera"
        className="flex h-12 flex-5 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold tracking-tight text-black transition active:opacity-90"
        style={{
          transitionDuration: "200ms",
          transitionTimingFunction: EASE,
        }}
      >
        <CameraIcon />
        Capture
      </Link>

      <button
        type="button"
        onClick={handleDownload}
        aria-label={saved ? "Saved" : "Save photos"}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] text-[14px] font-medium tracking-tight text-white backdrop-blur-md transition active:opacity-75"
        style={{
          borderWidth: "0.5px",
          transitionDuration: "200ms",
          transitionTimingFunction: EASE,
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {saved ? <CheckIcon /> : <DownloadIcon />}
      </button>

      <QRSheet
        eventName={eventName}
        absolute={absolute}
        display={display}
        qrSvg={qrSvg}
      />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 4v12" />
      <path d="M6 11l6 6 6-6" />
      <path d="M5 20h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}
