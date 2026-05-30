import type { ReactNode } from "react";

/** Titled surface with a right-aligned summary, wrapping a control. */
export default function SettingCard({
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
