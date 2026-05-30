import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEventBySlug } from "@/lib/queries/events";
import { getEventPhotos, publicPhotoUrl } from "@/lib/queries/photos";
import ManageActions from "./manage-actions";
import ManageRealtimeRefresher from "./realtime-refresher";
import EventSettingsSheet from "./event-settings-sheet";
import CountdownTimer from "@/components/Countdown";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

async function buildGuestUrl(slug: string) {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const path = `/event/${encodeURIComponent(slug)}`;
  return {
    absolute: `${proto}://${host}${path}`,
    display: `${host}${path}`,
  };
}

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventBySlug(id);
  if (!event) notFound();

  // Owner-only: anyone else gets bounced to the public event landing.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || event.owner_id !== user.id) {
    redirect(`/event/${encodeURIComponent(event.slug)}`);
  }

  const photos = await getEventPhotos(event.id);
  const { absolute, display } = await buildGuestUrl(event.slug);
  const qrSvg = await QRCode.toString(absolute, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#0a0a0b", light: "#ffffff" },
  });
  console.log(event);

  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <ManageRealtimeRefresher eventId={event.id} />

      <header className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md transition active:opacity-75"
            style={{
              borderWidth: "0.5px",
              transitionDuration: "200ms",
              transitionTimingFunction: EASE,
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white/75"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </Link>
          <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
            Organizer
          </span>
          <EventSettingsSheet
            event={{
              id: event.id,
              slug: event.slug,
              name: event.name,
              end_at: event.end_at,
              reveal_mode: event.reveal_mode,
              reveal_at: event.reveal_at,
              shots_per_person: event.shots_per_person,
              visibility: event.visibility,
            }}
          />
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
            Live Event
          </p>
          <h1 className="mt-2 text-[32px] font-semibold leading-[1.05] tracking-tight text-white">
            {event.name}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white/85" />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
                Live
              </span>
            </div>
            <span
              aria-hidden
              className="h-3 w-px bg-white/10"
              style={{ width: "0.5px" }}
            />
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] tabular-nums text-white/55">
              {photos.length} {photos.length === 1 ? "Photo" : "Photos"}
            </span>
          </div>

          <div className="mt-6">
            <ManageActions
              eventId={event.slug}
              eventName={event.name}
              absolute={absolute}
              display={display}
              qrSvg={qrSvg}
            />
          </div>
        </div>
      </header>

      <section className="mt-8 px-5 pb-10">
        {event.reveal_mode !== "live" &&
          (event.reveal_mode === "end" ? event.end_at : event.reveal_at) && (
            <CountdownTimer
              targetDate={
                event.reveal_mode === "end" ? event.end_at! : event.reveal_at!
              }
            />
          )}
        {photos.length === 0 ? (
          <EmptyGrid />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative aspect-[2/3] overflow-hidden rounded-[16px] border border-white/[0.06]"
                style={{
                  borderWidth: "0.5px",
                  marginTop:
                    event.reveal_mode !== "live" ? "1.5rem" : undefined,
                  filter: event.reveal_mode !== "live" ? "blur(20px)" : "none",
                }}
                aria-label={`Photo by ${p.participant_name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicPhotoUrl(p.storage_path)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span
                  className="absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-1 text-[10px] font-medium tracking-tight text-white/90"
                  style={{
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  {p.participant_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden
      />
    </main>
  );
}

function EmptyGrid() {
  return (
    <div className="mt-12 flex flex-col items-center gap-3 px-6 text-center">
      <div
        className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md"
        style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(10px)" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white/45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <circle cx="12" cy="12.5" r="2.5" />
          <path d="M9 6l1-1.5h4L15 6" />
        </svg>
      </div>
      <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
        No photos yet
      </p>
      <p className="max-w-xs text-[13px] font-light leading-relaxed text-white/55">
        Photos appear here as guests capture them.
      </p>
    </div>
  );
}
