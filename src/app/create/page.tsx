"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CreateHeader from "@/components/create/CreateHeader";
import StepEnd from "@/components/create/StepEnd";
import StepFrame from "@/components/create/StepFrame";
import StepLimits from "@/components/create/StepLimits";
import StepName from "@/components/create/StepName";
import StepReveal from "@/components/create/StepReveal";
import {
  STEPS,
  rollToShots,
  type RevealMode,
  type Roll,
  type Visibility,
} from "@/components/create/types";
import { toLocalDateTime } from "@/lib/datetime";
import { slugify } from "@/lib/slug";
import { EASE } from "@/lib/ui";
import { createEventAction } from "./actions";

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

  // Default the end/reveal time to the top of the hour, three hours out.
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
      <CreateHeader step={step} onBack={handleBack} />

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
