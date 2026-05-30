"use client";

import type { FormEvent } from "react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { EASE } from "@/lib/ui";
import StepActions from "./StepActions";
import StepHero from "./StepHero";

/** Step 1 — event name input with a live slug preview. */
export default function StepName({
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
