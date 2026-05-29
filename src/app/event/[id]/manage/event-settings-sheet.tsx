"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import SegmentedControl from "@/components/segmented-control";
import type { RevealMode, VisibilityMode } from "@/lib/supabase/types";
import { updateEventAction } from "./actions";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const ANIM_MS = 320;
const DRAG_START_PX = 5;
const CLOSE_PX = 100;

type Roll = "10" | "20" | "50" | "inf";

const REVEAL_OPTIONS: { value: RevealMode; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "end", label: "At End" },
  { value: "scheduled", label: "Scheduled" },
];

const ROLL_OPTIONS: { value: Roll; label: string }[] = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "inf", label: "∞" },
];

const VISIBILITY_OPTIONS: { value: VisibilityMode; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "everyone", label: "Everyone" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function shotsToRoll(n: number | null): Roll {
  if (n === 10) return "10";
  if (n === 20) return "20";
  if (n === 50) return "50";
  return "inf";
}

function rollToShots(r: Roll): number | null {
  if (r === "inf") return null;
  return Number(r);
}

export default function EventSettingsSheet({
  event,
}: {
  event: {
    id: string;
    slug: string;
    name: string;
    end_at: string;
    reveal_mode: RevealMode;
    reveal_at: string | null;
    shots_per_person: number | null;
    visibility: VisibilityMode;
  };
}) {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);

  const startYRef = useRef(0);
  const potentialRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  const [endAt, setEndAt] = useState(() => isoToLocal(event.end_at));
  const [revealMode, setRevealMode] = useState<RevealMode>(event.reveal_mode);
  const [revealAt, setRevealAt] = useState(() => isoToLocal(event.reveal_at));
  const [shotsPerPerson, setShotsPerPerson] = useState<Roll>(() =>
    shotsToRoll(event.shots_per_person),
  );
  const [visibility, setVisibility] = useState<VisibilityMode>(
    event.visibility,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setEndAt(isoToLocal(event.end_at));
    setRevealMode(event.reveal_mode);
    setRevealAt(isoToLocal(event.reveal_at));
    setShotsPerPerson(shotsToRoll(event.shots_per_person));
    setVisibility(event.visibility);
    setError(null);
    setIsMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true));
    });
  }, [event]);

  const close = useCallback(() => {
    setIsOpen(false);
    closeTimerRef.current = window.setTimeout(() => {
      setIsMounted(false);
      setDragY(0);
      closeTimerRef.current = null;
    }, ANIM_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMounted]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, label, [data-no-drag]"))
      return;
    startYRef.current = e.clientY;
    potentialRef.current = true;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!potentialRef.current) return;
    const dy = e.clientY - startYRef.current;
    if (!isDragging && Math.abs(dy) < DRAG_START_PX) return;
    if (!isDragging) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setIsDragging(true);
    }
    setDragY(Math.max(0, dy));
  };

  const finishDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    potentialRef.current = false;
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > CLOSE_PX) {
      close();
    } else {
      setDragY(0);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!endAt) {
      setError("End time is required.");
      return;
    }
    if (revealMode === "scheduled" && !revealAt) {
      setError("Pick a reveal time or change the reveal mode.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await updateEventAction({
      id: event.id,
      slug: event.slug,
      end_at: new Date(endAt).toISOString(),
      reveal_mode: revealMode,
      reveal_at:
        revealMode === "scheduled" && revealAt
          ? new Date(revealAt).toISOString()
          : null,
      shots_per_person: rollToShots(shotsPerPerson),
      visibility,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    close();
    router.refresh();
  };

  const backdropOpacity = !isOpen
    ? 0
    : isDragging
      ? Math.max(0, 1 - dragY / 300)
      : 1;
  const sheetTransform = isDragging
    ? `translateY(${dragY}px)`
    : isOpen
      ? "translateY(0)"
      : "translateY(100%)";

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Event settings"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
        </svg>
      </button>

      {isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label="Event settings">
            <div
              aria-hidden
              onClick={close}
              className="fixed inset-0 z-40 bg-black/65"
              style={{
                opacity: backdropOpacity,
                transition: isDragging
                  ? "none"
                  : `opacity ${ANIM_MS}ms ${EASE}`,
              }}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[28px] border-t border-white/10 bg-[#121214]"
              style={{
                transform: sheetTransform,
                transition: isDragging
                  ? "none"
                  : `transform ${ANIM_MS}ms ${EASE}`,
                borderTopWidth: "0.5px",
                paddingBottom: "env(safe-area-inset-bottom)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                style={{ touchAction: "none" }}
              >
                <div className="flex justify-center pb-2 pt-2.5">
                  <span
                    aria-hidden
                    className="h-1 w-10 rounded-full bg-white/20"
                  />
                </div>
                <div className="px-6 pb-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
                    Event Rules
                  </p>
                  <p className="mt-1 truncate text-[16px] font-semibold tracking-tight">
                    {event.name}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col overflow-y-auto"
                style={{ touchAction: "pan-y" }}
              >
                <div className="space-y-3 px-5">
                  <Field label="End Time">
                    <DateTimeInput
                      value={endAt}
                      onChange={setEndAt}
                      ariaLabel="End time"
                    />
                  </Field>
                  <Field label="Reveal">
                    <SegmentedControl
                      options={REVEAL_OPTIONS}
                      value={revealMode}
                      onChange={setRevealMode}
                    />
                  </Field>
                  {revealMode === "scheduled" && (
                    <Field label="Reveal At">
                      <DateTimeInput
                        value={revealAt}
                        onChange={setRevealAt}
                        ariaLabel="Reveal time"
                      />
                    </Field>
                  )}
                  <Field label="Shots Per Person">
                    <SegmentedControl
                      options={ROLL_OPTIONS}
                      value={shotsPerPerson}
                      onChange={setShotsPerPerson}
                    />
                  </Field>
                  <Field label="Visibility">
                    <SegmentedControl
                      options={VISIBILITY_OPTIONS}
                      value={visibility}
                      onChange={setVisibility}
                    />
                  </Field>
                  {error && (
                    <p
                      role="alert"
                      className="px-1 text-center text-[11px] font-light leading-relaxed text-white/55"
                    >
                      {error}
                    </p>
                  )}
                </div>

                <div className="mt-6 px-5 pb-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex h-14 w-full items-center justify-center rounded-full bg-white text-[15px] font-semibold tracking-tight text-black transition active:opacity-90 disabled:opacity-40"
                    style={{
                      transitionDuration: "200ms",
                      transitionTimingFunction: EASE,
                    }}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-[#1a1a1d]/60 p-4"
      style={{ borderWidth: "0.5px" }}
    >
      <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.32em] text-white/50">
        {label}
      </p>
      {children}
    </div>
  );
}

function DateTimeInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <label
      className="flex h-12 w-full items-center justify-between rounded-full border border-white/10 bg-white/[0.04] pl-5 pr-4 focus-within:border-white/25"
      style={{
        borderWidth: "0.5px",
        transition: `border-color 200ms ${EASE}`,
      }}
    >
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="flex-1 appearance-none bg-transparent text-[14px] font-medium tracking-tight text-white outline-none [color-scheme:dark]"
        style={{ minWidth: 0 }}
      />
      <svg
        viewBox="0 0 24 24"
        className="ml-3 h-4 w-4 shrink-0 text-white/55"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      </svg>
    </label>
  );
}
