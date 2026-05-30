import BackIcon from "@/components/icons/ChevronIcon";
import CloseIcon from "@/components/icons/CloseIcon";
import { EASE } from "@/lib/ui";
import { STEPS } from "./types";

/** Wizard header: back/cancel button and a step progress indicator. */
export default function CreateHeader({
  step,
  onBack,
}: {
  step: number;
  onBack: () => void;
}) {
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
        {step === 1 ? (
          <CloseIcon className="h-4 w-4 text-white/75" />
        ) : (
          <BackIcon direction="left" className="h-4 w-4 text-white/75" />
        )}
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
