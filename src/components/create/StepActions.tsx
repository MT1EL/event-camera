import type { ReactNode } from "react";

/** Bottom action area holding a step's primary button (and optional error). */
export default function StepActions({ children }: { children: ReactNode }) {
  return <div className="px-5 pb-8 pt-8">{children}</div>;
}
