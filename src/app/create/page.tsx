"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createEventAction } from "./actions";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const STEPS = 4;

type RevealMode = "live" | "end" | "scheduled";
type Roll = "10" | "20" | "50" | "inf";
type Visibility = "owner" | "everyone";

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

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "everyone", label: "Everyone" },
];

const ROLL_SUMMARY: Record<Roll, string> = {
  "10": "10 Shots",
  "20": "20 Shots",
  "50": "50 Shots",
  inf: "Unlimited",
};

const VISIBILITY_SUMMARY: Record<Visibility, string> = {
  owner: "Organizer only",
  everyone: "All guests",
};

const pad = (n: number) => String(n).padStart(2, "0");

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function formatDateTimeSummary(value: string): string {
  if (!value) return "Pick a time";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Pick a time";

  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;

  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${date} · ${time}`;
}

function rollToShots(r: Roll): number | null {
  if (r === "inf") return null;
  return Number(r);
}

export default function CreateEventPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [endAt, setEndAt] = useState("");
  const [revealMode, setRevealMode] = useState<RevealMode>("live");
  const [revealAt, setRevealAt] = useState("");
  const [shotsPerPerson, setShotsPerPerson] = useState<Roll>("20");
  const [visibility, setVisibility] = useState<Visibility>("everyone");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const d = new Date();
    d.setHours(d.getHours() + 3, 0, 0, 0);
    const v = toLocalDateTime(d);
    setEndAt(v);
    setRevealAt(v);
  }, []);

  const slug = slugify(name);

  const canContinue =
    step === 1
      ? slug.length > 0
      : step === 2
        ? endAt.length > 0
        : step === 3
          ? revealMode !== "scheduled" || revealAt.length > 0
          : !submitting;

  const blurActive = () => {
    if (typeof document === "undefined") return;
    const el = document.activeElement;
    if (el && el instanceof HTMLElement) el.blur();
  };

  const submitEvent = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const endIso = new Date(endAt).toISOString();
    const revealIso =
      revealMode === "scheduled" ? new Date(revealAt).toISOString() : null;

    const result = await createEventAction({
      slug,
      name: name.trim(),
      end_at: endIso,
      reveal_mode: revealMode,
      reveal_at: revealIso,
      shots_per_person: rollToShots(shotsPerPerson),
      visibility,
    });

    if (!result.ok) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(`/event/${encodeURIComponent(result.slug)}/manage`);
  };

  const handleNext = () => {
    if (!canContinue) return;
    blurActive();
    if (step < STEPS) {
      setStep((s) => s + 1);
      return;
    }
    void submitEvent();
  };

  const handleBack = () => {
    blurActive();
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main
      className="flex h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <Header step={step} onBack={handleBack} />

      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: `${STEPS * 100}%`,
            transform: `translateX(-${(step - 1) * (100 / STEPS)}%)`,
            transition: `transform 360ms ${EASE}`,
          }}
          aria-live="polite"
        >
          <StepFrame visible={step === 1}>
            <StepName
              name={name}
              setName={setName}
              slug={slug}
              canContinue={step === 1 && canContinue}
              onContinue={handleNext}
            />
          </StepFrame>
          <StepFrame visible={step === 2}>
            <StepEnd
              endAt={endAt}
              setEndAt={setEndAt}
              canContinue={step === 2 && canContinue}
              onContinue={handleNext}
            />
          </StepFrame>
          <StepFrame visible={step === 3}>
            <StepReveal
              revealMode={revealMode}
              setRevealMode={setRevealMode}
              revealAt={revealAt}
              setRevealAt={setRevealAt}
              canContinue={step === 3 && canContinue}
              onContinue={handleNext}
            />
          </StepFrame>
          <StepFrame visible={step === 4}>
            <StepLimits
              shotsPerPerson={shotsPerPerson}
              setShotsPerPerson={setShotsPerPerson}
              visibility={visibility}
              setVisibility={setVisibility}
              onCreate={handleNext}
              submitting={submitting}
              error={submitError}
            />
          </StepFrame>
        </div>
      </div>
    </main>
  );
}

function StepFrame({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="h-full shrink-0"
      style={{ width: `${100 / STEPS}%` }}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
}

function Header({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <header className="flex items-center justify-between px-5 pt-5">
      <button
        type="button"
        onClick={onBack}
        aria-label={step === 1 ? "Cancel" : "Back"}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md transition active:opacity-75"
        style={{
          borderWidth: "0.5px",
          transitionDuration: "200ms",
          transitionTimingFunction: EASE,
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {step === 1 ? <XIcon /> : <BackIcon />}
      </button>

      <div
        className="flex items-center gap-1.5"
        aria-label={`Step ${step} of ${STEPS}`}
      >
        {Array.from({ length: STEPS }).map((_, i) => {
          const s = i + 1;
          const isCurrent = s === step;
          const isPast = s < step;
          return (
            <span
              key={s}
              aria-hidden
              className="h-1.5 rounded-full"
              style={{
                width: isCurrent ? "20px" : "6px",
                backgroundColor:
                  isCurrent || isPast
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(255,255,255,0.2)",
                transition: `width 320ms ${EASE}, background-color 320ms ${EASE}`,
              }}
            />
          );
        })}
      </div>

      <span className="w-11" aria-hidden />
    </header>
  );
}

function StepName({
  name,
  setName,
  slug,
  canContinue,
  onContinue,
}: {
  name: string;
  setName: (v: string) => void;
  slug: string;
  canContinue: boolean;
  onContinue: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onContinue();
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex flex-1 flex-col justify-center px-6">
        <StepHero
          stepLabel="Event Name"
          title="Name your event"
          helper="Guests will see this name when they join."
        />

        <div className="mt-10">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Gala"
            autoFocus
            maxLength={64}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            className="block w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[17px] font-medium tracking-tight text-white placeholder:font-light placeholder:text-white/30 backdrop-blur-md focus:border-white/25 focus:outline-none"
            style={{
              borderWidth: "0.5px",
              WebkitBackdropFilter: "blur(10px)",
              transition: `border-color 200ms ${EASE}`,
            }}
          />
          <p className="mt-3 h-3 px-5 text-[10px] font-medium uppercase tracking-[0.28em] tabular-nums text-white/35">
            {slug ? `/event/${slug}` : ""}
          </p>
        </div>
      </div>

      <StepActions>
        <PrimaryButton type="submit" disabled={!canContinue}>
          Continue
        </PrimaryButton>
      </StepActions>
    </form>
  );
}

function StepEnd({
  endAt,
  setEndAt,
  canContinue,
  onContinue,
}: {
  endAt: string;
  setEndAt: (v: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onContinue();
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-4 pt-8">
        <StepHero
          stepLabel="End Time"
          title="When does it end?"
          helper="Photos can be captured until this time."
        />

        <div className="mt-6">
          <InlineCalendar value={endAt} onChange={setEndAt} />
          <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            {endAt ? `Ends ${formatDateTimeSummary(endAt)}` : ""}
          </p>
        </div>
      </div>

      <StepActions>
        <PrimaryButton type="submit" disabled={!canContinue}>
          Continue
        </PrimaryButton>
      </StepActions>
    </form>
  );
}

function InlineCalendar({
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

  const adjust = (
    field: "hour" | "minute" | "period",
    direction: 1 | -1,
  ) => {
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
      new Date(
        cur.getFullYear(),
        cur.getMonth(),
        cur.getDate(),
        newH,
        newM,
        0,
        0,
      ),
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
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 text-white/75"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </CalNavButton>
        <span className="text-[13px] font-semibold tracking-tight text-white">
          {monthName}
        </span>
        <CalNavButton onClick={nextMonth} ariaLabel="Next month">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 text-white/75"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
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
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3 text-white/45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 15l6-6 6 6" />
        </svg>
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
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3 text-white/45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 9l-6 6-6-6" />
        </svg>
      </button>
    </div>
  );
}

function StepReveal({
  revealMode,
  setRevealMode,
  revealAt,
  setRevealAt,
  canContinue,
  onContinue,
}: {
  revealMode: RevealMode;
  setRevealMode: (v: RevealMode) => void;
  revealAt: string;
  setRevealAt: (v: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onContinue();
  };

  const summary =
    revealMode === "live"
      ? "Photos appear as guests upload"
      : revealMode === "end"
        ? "Photos appear after the event ends"
        : revealAt
          ? `Revealed ${formatDateTimeSummary(revealAt)}`
          : "Pick a reveal time";

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex flex-1 flex-col justify-center px-6">
        <StepHero
          stepLabel="Reveal"
          title="When are photos revealed?"
          helper="Choose when guests can see the gallery."
        />

        <div className="mt-10 space-y-3">
          <SegmentedControl
            options={REVEAL_OPTIONS}
            value={revealMode}
            onChange={setRevealMode}
          />
          {revealMode === "scheduled" && (
            <DateTimeField
              value={revealAt}
              onChange={setRevealAt}
              ariaLabel="Reveal date and time"
            />
          )}
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            {summary}
          </p>
        </div>
      </div>

      <StepActions>
        <PrimaryButton type="submit" disabled={!canContinue}>
          Continue
        </PrimaryButton>
      </StepActions>
    </form>
  );
}

function StepLimits({
  shotsPerPerson,
  setShotsPerPerson,
  visibility,
  setVisibility,
  onCreate,
  submitting,
  error,
}: {
  shotsPerPerson: Roll;
  setShotsPerPerson: (v: Roll) => void;
  visibility: Visibility;
  setVisibility: (v: Visibility) => void;
  onCreate: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col justify-center px-5 py-6">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
            Last touches
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-tight">
            Set capacity & access
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[13px] font-light leading-relaxed text-white/55">
            Choose how many shots each guest gets and who can see the gallery.
          </p>
        </div>

        <div className="space-y-3">
          <SettingCard
            title="Shots Per Person"
            summary={ROLL_SUMMARY[shotsPerPerson]}
          >
            <SegmentedControl
              options={ROLL_OPTIONS}
              value={shotsPerPerson}
              onChange={setShotsPerPerson}
            />
          </SettingCard>
          <SettingCard
            title="Visibility"
            summary={VISIBILITY_SUMMARY[visibility]}
          >
            <SegmentedControl
              options={VISIBILITY_OPTIONS}
              value={visibility}
              onChange={setVisibility}
            />
          </SettingCard>
        </div>
      </div>

      <StepActions>
        <PrimaryButton onClick={onCreate} disabled={submitting}>
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-black/80"
            />
            {submitting ? "Creating…" : "Create Event"}
          </span>
        </PrimaryButton>
        {error && (
          <p
            role="alert"
            className="mt-3 text-center text-[11px] font-light leading-relaxed text-white/55"
          >
            {error}
          </p>
        )}
      </StepActions>
    </div>
  );
}

function StepHero({
  stepLabel,
  title,
  helper,
}: {
  stepLabel: string;
  title: string;
  helper: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
        {stepLabel}
      </p>
      <h1 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-tight">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-[13px] font-light leading-relaxed text-white/55">
        {helper}
      </p>
    </div>
  );
}

function StepActions({ children }: { children: ReactNode }) {
  return <div className="px-5 pb-8 pt-8">{children}</div>;
}

function PrimaryButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center rounded-full bg-white text-[15px] font-semibold tracking-tight text-black transition active:opacity-90 disabled:opacity-30"
      style={{
        transitionDuration: "200ms",
        transitionTimingFunction: EASE,
      }}
    >
      {children}
    </button>
  );
}

function SettingCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-[#121214]/70 p-4 backdrop-blur-md"
      style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(14px)" }}
    >
      <div className="mb-3 flex items-baseline justify-between px-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/50">
          {title}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/40">
          {summary}
        </p>
      </div>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const count = options.length;

  return (
    <div
      className="relative rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md"
      style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(10px)" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-1 top-1 rounded-full border border-white/15 bg-white/[0.12]"
        style={{
          width: `calc((100% - 0.5rem) / ${count})`,
          left: `calc(0.25rem + ${selectedIndex} * ((100% - 0.5rem) / ${count}))`,
          transition: `left 320ms ${EASE}`,
          borderWidth: "0.5px",
        }}
      />
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className="h-10 rounded-full text-[12px] font-medium tracking-[0.06em]"
              style={{
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
                transition: `color 200ms ${EASE}`,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateTimeField({
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
      className="flex h-12 w-full cursor-pointer items-center justify-between rounded-full border border-white/10 bg-white/[0.04] pl-5 pr-4 backdrop-blur-md focus-within:border-white/25"
      style={{
        borderWidth: "0.5px",
        WebkitBackdropFilter: "blur(10px)",
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

function XIcon() {
  return (
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
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-white/75"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
