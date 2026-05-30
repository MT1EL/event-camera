import type { ReactNode } from "react";
import { EASE } from "@/lib/ui";

export default function PrimaryButton({
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
