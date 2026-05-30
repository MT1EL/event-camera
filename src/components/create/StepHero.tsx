/** Centered title block (eyebrow label + heading + helper) shared by each step. */
export default function StepHero({
  stepLabel,
  title,
  helper,
}: {
  stepLabel: string;
  title: string;
  helper: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
        {stepLabel}
      </p>
      <h1 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-tight">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-[13px] font-light leading-relaxed text-white/55">
        {helper}
      </p>
    </div>
  );
}
