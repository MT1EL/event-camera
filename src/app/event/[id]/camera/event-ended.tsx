import Link from "next/link";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Shown in place of the camera once an event's end time has passed. */
export default function EventEnded({
  eventName,
  eventSlug,
}: {
  eventName: string;
  eventSlug: string;
}) {
  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <header className="flex items-center justify-between px-5 pt-5">
        <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/30">
          Event
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
          Ended
        </span>
      </header>

      <section className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-xs flex-col items-center text-center">
          <div
            className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md"
            style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(10px)" }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white/55"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5V12l3 2" />
            </svg>
          </div>

          <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
            This event has ended
          </p>
          <h1 className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-tight">
            {eventName}
          </h1>
          <p className="mt-3 max-w-xs text-[14px] font-light leading-relaxed text-white/55">
            Photo taking is closed. Catch the moments everyone captured, or start
            an event of your own.
          </p>
        </div>
      </section>

      <div className="w-full max-w-sm self-center px-5 pb-8">
        <Link
          href="/"
          className="flex h-14 w-full items-center justify-center rounded-full bg-white text-base font-semibold tracking-tight text-black transition-opacity active:opacity-90"
          style={{
            transitionDuration: "200ms",
            transitionTimingFunction: EASE,
          }}
        >
          Create your own
        </Link>
        <Link
          href={`/event/${encodeURIComponent(eventSlug)}/gallery`}
          className="mt-3 flex h-14 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-base font-medium tracking-tight text-white transition-opacity active:opacity-80"
          style={{
            borderWidth: "0.5px",
            transitionDuration: "200ms",
            transitionTimingFunction: EASE,
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          View gallery
        </Link>
      </div>
    </main>
  );
}
