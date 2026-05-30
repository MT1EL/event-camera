"use client";

import PrimaryButton from "@/components/buttons/PrimaryButton";
import SegmentedControl from "@/components/segmented-control";
import SettingCard from "./SettingCard";
import StepActions from "./StepActions";
import {
  ROLL_OPTIONS,
  ROLL_SUMMARY,
  VISIBILITY_OPTIONS,
  VISIBILITY_SUMMARY,
  type Roll,
  type Visibility,
} from "./types";

/** Step 4 — capacity and access settings, plus the final create action. */
export default function StepLimits({
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
          <SettingCard title="Visibility" summary={VISIBILITY_SUMMARY[visibility]}>
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
