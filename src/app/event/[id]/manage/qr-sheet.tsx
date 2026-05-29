"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const ANIM_MS = 320;
const DRAG_START_PX = 5;
const CLOSE_PX = 100;

type Props = {
  eventName: string;
  absolute: string;
  display: string;
  qrSvg: string;
};

export default function QRSheet({
  eventName,
  absolute,
  display,
  qrSvg,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [copied, setCopied] = useState(false);

  const startYRef = useRef(0);
  const potentialRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  const open = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true));
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    closeTimerRef.current = window.setTimeout(() => {
      setIsMounted(false);
      setDragY(0);
      closeTimerRef.current = null;
    }, ANIM_MS);
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

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, label, [data-no-drag]")) {
      return;
    }
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

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => finishDrag(e);
  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) =>
    finishDrag(e);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(absolute);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = absolute;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* swallow */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, [absolute]);

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
        aria-label="Show QR code"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] text-[14px] font-medium tracking-tight text-white backdrop-blur-md transition active:opacity-75"
        style={{
          borderWidth: "0.5px",
          transitionDuration: "200ms",
          transitionTimingFunction: EASE,
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="15" y="3" width="6" height="6" rx="1" />
          <rect x="3" y="15" width="6" height="6" rx="1" />
          <path d="M14 14h3v3h-3zM18 18h3v3h-3z" />
        </svg>
      </button>

      {isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label="Share QR code">
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
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] border-t border-white/10 bg-[#121214]"
              style={{
                transform: sheetTransform,
                transition: isDragging
                  ? "none"
                  : `transform ${ANIM_MS}ms ${EASE}`,
                borderTopWidth: "0.5px",
                paddingBottom: "env(safe-area-inset-bottom)",
                touchAction: "none",
                WebkitBackdropFilter: "blur(20px)",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              <div className="flex justify-center pb-2 pt-2.5">
                <span
                  aria-hidden
                  className="h-1 w-10 rounded-full bg-white/20"
                />
              </div>

              <div className="px-6 pb-6">
                <div className="flex flex-col items-center text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
                    Scan to Join
                  </p>
                  <h2 className="mt-2 max-w-[16rem] text-[22px] font-semibold leading-[1.1] tracking-tight">
                    {eventName}
                  </h2>
                  <p className="mt-2 max-w-xs text-[13px] font-light leading-relaxed text-white/55">
                    Point a camera at the code to enter the event.
                  </p>

                  <div
                    className="mt-6 rounded-3xl bg-white p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
                    aria-label="Event QR code"
                  >
                    <div
                      className="h-[208px] w-[208px] [&>svg]:h-full [&>svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? "Link copied" : "Copy share link"}
                  className="mt-6 flex h-14 w-full items-center justify-between rounded-full border border-white/10 bg-white/[0.06] pl-5 pr-4 text-left backdrop-blur-md transition active:opacity-75"
                  style={{
                    borderWidth: "0.5px",
                    transitionDuration: "200ms",
                    transitionTimingFunction: EASE,
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-white/40">
                      Share Link
                    </span>
                    <span className="mt-0.5 truncate text-[13px] font-medium tracking-tight text-white/90">
                      {display}
                    </span>
                  </span>
                  <span
                    className="ml-3 inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] px-4 text-[11px] font-medium uppercase tracking-[0.24em] text-white"
                    style={{
                      transition: `background-color 200ms ${EASE}, color 200ms ${EASE}`,
                      backgroundColor: copied
                        ? "rgba(255,255,255,0.95)"
                        : undefined,
                      color: copied ? "#0a0a0b" : undefined,
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
