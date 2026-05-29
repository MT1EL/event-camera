"use client";

import {
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

type Participant = { name: string; count: number; color: string };

export default function ParticipantsSheet({
  open,
  onClose,
  participants,
}: {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);

  const startYRef = useRef(0);
  const potentialRef = useRef(false);

  useEffect(() => {
    if (!open) {
      const r = requestAnimationFrame(() => setIsOpen(false));
      const t = window.setTimeout(() => {
        setIsMounted(false);
        setDragY(0);
      }, ANIM_MS);
      return () => {
        cancelAnimationFrame(r);
        window.clearTimeout(t);
      };
    }

    let r2Id = 0;
    const r1 = requestAnimationFrame(() => {
      setIsMounted(true);
      r2Id = requestAnimationFrame(() => setIsOpen(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2Id);
    };
  }, [open]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMounted]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
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
      onClose();
    } else {
      setDragY(0);
    }
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

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Participants">
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/65"
        style={{
          opacity: backdropOpacity,
          transition: isDragging ? "none" : `opacity ${ANIM_MS}ms ${EASE}`,
        }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80dvh] flex-col rounded-t-[28px] border-t border-white/10 bg-[#121214]"
        style={{
          transform: sheetTransform,
          transition: isDragging ? "none" : `transform ${ANIM_MS}ms ${EASE}`,
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
              Participants
            </p>
            <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight">
              {participants.length} People
            </p>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 pb-6"
          style={{ touchAction: "pan-y" }}
        >
          <ul className="divide-y divide-white/[0.05]">
            {participants.map((p) => (
              <li key={p.name} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden
                  className="h-9 w-9 shrink-0 rounded-full border border-white/[0.06]"
                  style={{
                    backgroundColor: p.color,
                    borderWidth: "0.5px",
                  }}
                />
                <span className="flex-1 truncate text-[14px] font-medium tracking-tight text-white">
                  {p.name}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.24em] tabular-nums text-white/55">
                  {p.count} {p.count === 1 ? "Moment" : "Moments"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
