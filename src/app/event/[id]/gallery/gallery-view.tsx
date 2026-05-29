"use client";

import Link from "next/link";
import { usePhotos } from "../event-state";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function GalleryView({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const { photos } = usePhotos();
  const ordered = [...photos].reverse();

  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <Link
            href={`/event/${encodeURIComponent(eventId)}/camera`}
            aria-label="Close gallery"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md transition active:opacity-75"
            style={{
              borderWidth: "0.5px",
              transitionDuration: "200ms",
              transitionTimingFunction: EASE,
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white/75"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
          <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
            Gallery
          </span>
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
            Live Event
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-[1.05] tracking-tight">
            {eventName}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white/85" />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
                Live
              </span>
            </div>
            <span
              aria-hidden
              className="h-3 bg-white/10"
              style={{ width: "0.5px" }}
            />
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] tabular-nums text-white/55">
              {photos.length} Photo{photos.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </header>

      <section
        className="mt-8 px-5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2.5rem)" }}
      >
        {ordered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {ordered.map((p) => (
              <div
                key={p.id}
                className="relative aspect-square overflow-hidden rounded-[10px] border border-white/[0.06]"
                style={{
                  borderWidth: "0.5px",
                  backgroundImage: `url(${p.src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                aria-label={`Photo ${p.id}`}
              >
                <span
                  className="absolute bottom-2 left-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-medium tracking-[0.18em] tabular-nums text-white/90"
                  style={{ backdropFilter: "blur(6px)" }}
                >
                  {String(p.id).padStart(4, "0")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="mt-20 flex flex-col items-center gap-3 px-6 text-center">
      <div
        className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md"
        style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(10px)" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white/45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <circle cx="12" cy="12.5" r="2.5" />
          <path d="M9 6l1-1.5h4L15 6" />
        </svg>
      </div>
      <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
        No shots yet
      </p>
      <p className="max-w-xs text-[13px] font-light leading-relaxed text-white/55">
        Captured photos from this session appear here.
      </p>
    </div>
  );
}
