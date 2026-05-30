import CalendarIcon from "@/components/icons/CalendarIcon";
import { EASE } from "@/lib/ui";

/** Pill-shaped native `datetime-local` field with a calendar affordance. */
export default function DateTimeField({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <label
      className="flex h-12 w-full cursor-pointer items-center justify-between rounded-full border border-white/10 bg-white/[0.04] pl-5 pr-4 backdrop-blur-md focus-within:border-white/25"
      style={{
        borderWidth: "0.5px",
        WebkitBackdropFilter: "blur(10px)",
        transition: `border-color 200ms ${EASE}`,
      }}
    >
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="flex-1 appearance-none bg-transparent text-[14px] font-medium tracking-tight text-white outline-none [color-scheme:dark]"
        style={{ minWidth: 0 }}
      />
      <CalendarIcon className="ml-3 h-4 w-4 shrink-0 text-white/55" />
    </label>
  );
}
