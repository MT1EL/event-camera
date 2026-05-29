"use client";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const count = options.length;

  return (
    <div
      className="relative rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md"
      style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(10px)" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-1 top-1 rounded-full border border-white/15 bg-white/[0.12]"
        style={{
          width: `calc((100% - 0.5rem) / ${count})`,
          left: `calc(0.25rem + ${selectedIndex} * ((100% - 0.5rem) / ${count}))`,
          transition: `left 320ms ${EASE}`,
          borderWidth: "0.5px",
        }}
      />
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className="h-10 rounded-full text-[12px] font-medium tracking-[0.06em]"
              style={{
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
                transition: `color 200ms ${EASE}`,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
