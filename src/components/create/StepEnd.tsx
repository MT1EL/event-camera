"use client";

import type { FormEvent } from "react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { formatDateTimeSummary } from "@/lib/datetime";
import InlineCalendar from "./InlineCalendar";
import StepActions from "./StepActions";
import StepHero from "./StepHero";

/** Step 2 — pick the event end date/time via the inline calendar. */
export default function StepEnd({
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
