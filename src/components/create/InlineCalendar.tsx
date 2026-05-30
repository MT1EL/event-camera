"use client";

import { useEffect, useState, type ReactNode } from "react";
import ChevronIcon from "@/components/icons/ChevronIcon";
import { pad, toLocalDateTime } from "@/lib/datetime";
import { EASE } from "@/lib/ui";

/** Self-contained dark calendar + time stepper that emits a `datetime-local` value. */
export default function InlineCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const parsed = (() => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  })();

  const base = parsed ?? new Date();

  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());

  useEffect(() => {
    if (!value) return;
    const r = requestAnimationFrame(() => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return;
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    });
    return () => cancelAnimationFrame(r);
  }, [value]);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-[360px] rounded-2xl border border-white/10 bg-[#121214]/70"
        style={{ borderWidth: "0.5px" }}
      />
    );
  }

  const commit = (d: Date) => onChange(toLocalDateTime(d));

  const selectDay = (day: number) => {
    const hour = parsed?.getHours() ?? 11;
    const minute = parsed?.getMinutes() ?? 0;
    commit(new Date(viewYear, viewMonth, day, hour, minute, 0, 0));
  };

  const adjust = (field: "hour" | "minute" | "period", direction: 1 | -1) => {
    const cur = parsed ?? base;
    const h = cur.getHours();
    const m = cur.getMinutes();
    let newH = h;
    let newM = m;
    if (field === "hour") {
      newH = (h + direction + 24) % 24;
    } else if (field === "minute") {
      newM = (m + direction * 5 + 60) % 60;
    } else if (field === "period") {
      newH = h >= 12 ? h - 12 : h + 12;
    }
    commit(
      new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), newH, newM, 0, 0),
    );
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  const today = new Date();
  const todayYMD = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const selectedYMD = parsed
    ? `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
    : null;

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const hour24 = (parsed ?? base).getHours();
  const minute = (parsed ?? base).getMinutes();
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period = hour24 >= 12 ? "PM" : "AM";

  return (
    <div
      className="rounded-2xl border border-white/10 bg-[#121214]/70 p-4 backdrop-blur-md"
      style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(14px)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <CalNavButton onClick={prevMonth} ariaLabel="Previous month">
          <ChevronIcon direction="left" className="h-3.5 w-3.5 text-white/75" />
        </CalNavButton>
        <span className="text-[13px] font-semibold tracking-tight text-white">
          {monthName}
        </span>
        <CalNavButton onClick={nextMonth} ariaLabel="Next month">
          <ChevronIcon direction="right" className="h-3.5 w-3.5 text-white/75" />
        </CalNavButton>
      </div>

      <div className="mb-1 grid grid-cols-7" aria-hidden>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="py-1 text-center text-[9px] font-medium uppercase tracking-[0.18em] text-white/30"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} aria-hidden />;
          const ymd = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isSelected = ymd === selectedYMD;
          const isToday = ymd === todayYMD;
          return (
            <button
              key={i}
              type="button"
              onClick={() => selectDay(day)}
              aria-label={`${monthName} ${day}`}
              aria-pressed={isSelected}
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium tabular-nums tracking-tight"
              style={{
                backgroundColor: isSelected ? "white" : "transparent",
                color: isSelected ? "#0a0a0b" : "rgba(255,255,255,0.85)",
                boxShadow:
                  isToday && !isSelected
                    ? "inset 0 0 0 1px rgba(255,255,255,0.35)"
                    : undefined,
                transition: `background-color 150ms ${EASE}, color 150ms ${EASE}`,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div
        aria-hidden
        className="my-4 h-px"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      />

      <div className="flex items-center justify-center gap-2.5">
        <TimeColumn
          value={String(hour12)}
          onUp={() => adjust("hour", 1)}
          onDown={() => adjust("hour", -1)}
          ariaLabel="Hour"
        />
        <span className="text-[22px] font-semibold leading-none text-white/30">
          :
        </span>
        <TimeColumn
          value={String(minute).padStart(2, "0")}
          onUp={() => adjust("minute", 1)}
          onDown={() => adjust("minute", -1)}
          ariaLabel="Minute"
        />
        <button
          type="button"
          onClick={() => adjust("period", 1)}
          aria-label={`Toggle ${period}`}
          className="ml-3 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-white transition active:opacity-75"
          style={{
            borderWidth: "0.5px",
            transitionDuration: "200ms",
            transitionTimingFunction: EASE,
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {period}
        </button>
      </div>
    </div>
  );
}

/** Round month-navigation button used by the calendar header. */
function CalNavButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition active:opacity-60"
      style={{
        borderWidth: "0.5px",
        transitionDuration: "150ms",
        transitionTimingFunction: EASE,
      }}
    >
      {children}
    </button>
  );
}

/** Up/down stepper column for a single time unit (hour or minute). */
function TimeColumn({
  value,
  onUp,
  onDown,
  ariaLabel,
}: {
  value: string;
  onUp: () => void;
  onDown: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onUp}
        aria-label={`Increase ${ariaLabel.toLowerCase()}`}
        className="flex h-5 w-9 items-center justify-center transition active:opacity-50"
      >
        <ChevronIcon direction="up" className="h-3 w-3 text-white/45" />
      </button>
      <span className="text-[22px] font-semibold leading-none tracking-tight text-white tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={onDown}
        aria-label={`Decrease ${ariaLabel.toLowerCase()}`}
        className="flex h-5 w-9 items-center justify-center transition active:opacity-50"
      >
        <ChevronIcon direction="down" className="h-3 w-3 text-white/45" />
      </button>
    </div>
  );
}
