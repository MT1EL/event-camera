import type { ReactNode } from "react";
import { STEPS } from "./types";

/** A single full-width slide in the horizontally-paged wizard. */
export default function StepFrame({
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
