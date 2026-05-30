"use client";

import type { FormEvent } from "react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SegmentedControl from "@/components/segmented-control";
import { formatDateTimeSummary } from "@/lib/datetime";
import DateTimeField from "./DateTimeField";
import StepActions from "./StepActions";
import StepHero from "./StepHero";
import { REVEAL_OPTIONS, type RevealMode } from "./types";

/** Step 3 — choose when uploaded photos become visible to guests. */
export default function StepReveal({
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
