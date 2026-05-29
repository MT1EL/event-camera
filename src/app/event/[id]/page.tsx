import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/queries/events";

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventBySlug(id);
  if (!event) notFound();

  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/80" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/55">
            Live
          </span>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/30">
          Event
        </span>
      </header>

      <section className="flex flex-1 items-center justify-center px-6">
        <div className="relative w-full max-w-xs px-6 py-10">
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l border-t border-white/15"
            style={{ borderLeftWidth: "0.5px", borderTopWidth: "0.5px" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r border-t border-white/15"
            style={{ borderRightWidth: "0.5px", borderTopWidth: "0.5px" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b border-l border-white/15"
            style={{ borderBottomWidth: "0.5px", borderLeftWidth: "0.5px" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/15"
            style={{ borderBottomWidth: "0.5px", borderRightWidth: "0.5px" }}
          />

          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
              Now Capturing
            </p>
            <h1 className="text-[34px] font-semibold leading-[1.05] tracking-tight text-white">
              {event.name}
            </h1>
            <p className="max-w-xs text-base leading-relaxed text-white/55">
              Capture moments from {event.name}
            </p>
          </div>
        </div>
      </section>

      <div className="w-full max-w-sm self-center px-5 pb-8">
        <Link
          href={`/event/${encodeURIComponent(event.slug)}/camera`}
          className="flex h-14 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-base font-medium tracking-tight text-white transition-opacity active:opacity-80"
          style={{
            borderWidth: "0.5px",
            transitionDuration: "200ms",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-white/90"
            />
            Enter Camera
          </span>
        </Link>
        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.24em] text-white/30">
          Tap to start shooting
        </p>
      </div>
    </main>
  );
}
