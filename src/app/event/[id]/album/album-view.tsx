"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { mockColor } from "@/lib/mock-events";
import ParticipantsSheet from "./participants-sheet";
import CheckIcon from "@/components/icons/CheckIcon";
import SendIcon from "@/components/icons/SendIcon";
import SaveIcon from "@/components/icons/SaveIcon";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const FEEDBACK_MS = 1600;

type ActionState = "idle" | "done";

export type AlbumPhoto = {
  id: string;
  index: number;
  src: string;
  participant: string;
};

export type AlbumPayload = {
  id: string;
  slug: string;
  name: string;
  endedAt: string; // ISO timestamp
  photoCount: number;
  participantCount: number;
};

function formatEndedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function AlbumView({
  album,
  photos,
}: {
  album: AlbumPayload;
  photos: AlbumPhoto[];
}) {
  const [sent, setSent] = useState<ActionState>("idle");
  const [saved, setSaved] = useState<ActionState>("idle");
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const participants = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of photos) {
      map.set(p.participant, (map.get(p.participant) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count, color: mockColor(name, 0) }))
      .sort((a, b) =>
        b.count !== a.count ? b.count - a.count : a.name.localeCompare(b.name),
      );
  }, [photos]);

  const handleSend = useCallback(async () => {
    if (sent === "done") return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `${album.name} — Event Camera`,
      text: `${album.photoCount} moments from ${album.name}`,
      url,
    };

    let delivered = false;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        delivered = true;
      } catch {
        /* user cancelled */
      }
    }
    if (!delivered && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* swallow */
      }
    }
    setSent("done");
    window.setTimeout(() => setSent("idle"), FEEDBACK_MS);
  }, [album, sent]);

  const handleSave = useCallback(() => {
    if (saved === "done") return;
    setSaved("done");
    window.setTimeout(() => setSaved("idle"), FEEDBACK_MS);
  }, [saved]);

  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="flex items-center justify-between px-5 pt-5">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
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
          Album
        </span>
        <span className="w-11" aria-hidden />
      </header>

      <section className="px-5 pb-6 pt-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
          Memory
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-[1.05] tracking-tight">
          {album.name}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Stat number={album.photoCount} label="Moments" />
          <MetaDot />
          <PeopleStat
            count={album.participantCount}
            onClick={() => setParticipantsOpen(true)}
          />
          <MetaDot />
          <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/55">
            Ended {formatEndedAt(album.endedAt)}
          </span>
        </div>

        <div className="mt-6 flex gap-3">
          <PrimaryAction
            label="Send"
            doneLabel="Sent"
            state={sent}
            onClick={handleSend}
            icon={sent === "done" ? <CheckIcon /> : <SendIcon />}
          />
          <SecondaryAction
            label="Save"
            doneLabel="Saved"
            state={saved}
            onClick={handleSave}
            icon={saved === "done" ? <CheckIcon /> : <SaveIcon />}
          />
        </div>
      </section>

      <section
        className="px-5"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 2.5rem)",
        }}
      >
        {photos.length === 0 ? (
          <p className="mt-10 text-center text-[12px] font-light leading-relaxed text-white/45">
            This event finished without photos.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {photos.map((p) => (
              <li key={p.id}>
                <div
                  className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121214]"
                  style={{ borderWidth: "0.5px" }}
                  aria-label={`Moment ${p.index} · ${p.participant}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span
                    className="absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium tracking-tight text-white/90"
                    style={{
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    {p.participant}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ParticipantsSheet
        open={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        participants={participants}
      />
    </main>
  );
}

function Stat({ number, label }: { number: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[18px] font-semibold tabular-nums leading-none tracking-tight text-white/90">
        {number}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/50">
        {label}
      </span>
    </span>
  );
}

function PeopleStat({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${count} participants`}
      className="inline-flex items-baseline gap-1.5 transition active:opacity-60"
      style={{
        transitionDuration: "150ms",
        transitionTimingFunction: EASE,
      }}
    >
      <span className="text-[18px] font-semibold tabular-nums leading-none tracking-tight text-white/90">
        {count}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/50">
        People
      </span>
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3 translate-y-px text-white/35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

function MetaDot() {
  return (
    <span
      aria-hidden
      className="inline-block h-1 w-1 rounded-full bg-white/25"
    />
  );
}

function PrimaryAction({
  label,
  doneLabel,
  state,
  icon,
  onClick,
}: {
  label: string;
  doneLabel: string;
  state: ActionState;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={state === "done" ? doneLabel : label}
      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold tracking-tight text-black transition active:opacity-90"
      style={{
        transitionDuration: "200ms",
        transitionTimingFunction: EASE,
      }}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{state === "done" ? doneLabel : label}</span>
    </button>
  );
}

function SecondaryAction({
  label,
  doneLabel,
  state,
  icon,
  onClick,
}: {
  label: string;
  doneLabel: string;
  state: ActionState;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={state === "done" ? doneLabel : label}
      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] text-[14px] font-medium tracking-tight text-white backdrop-blur-md transition active:opacity-75"
      style={{
        borderWidth: "0.5px",
        transitionDuration: "200ms",
        transitionTimingFunction: EASE,
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{state === "done" ? doneLabel : label}</span>
    </button>
  );
}
