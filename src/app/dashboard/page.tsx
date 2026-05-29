import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockColor } from "@/lib/mock-events";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type DashEvent = {
  id: string;
  slug: string;
  name: string;
  end_at: string;
  photo_count: number;
};

async function getDashboardEvents(): Promise<{
  active: DashEvent[];
  albums: DashEvent[];
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data } = await supabase
    .from("events")
    .select("id, slug, name, end_at, photos(count)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const events = (data ?? []).map((e) => {
    const rawCount = e.photos as unknown as { count: number }[] | undefined;
    return {
      id: e.id as string,
      slug: e.slug as string,
      name: e.name as string,
      end_at: e.end_at as string,
      photo_count: rawCount?.[0]?.count ?? 0,
    };
  });

  const now = new Date().toISOString();
  return {
    active: events.filter((e) => e.end_at > now),
    albums: events.filter((e) => e.end_at <= now),
  };
}

export default async function DashboardPage() {
  const { active, albums } = await getDashboardEvents();

  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <Header />

      <Section
        title="Active"
        action={active.length > 0 ? <NewEventAction /> : null}
      >
        {active.length > 0 ? (
          <ul className="space-y-3">
            {active.map((event) => (
              <li key={event.id}>
                <ActiveCard event={event} />
              </li>
            ))}
          </ul>
        ) : (
          <CreateEventCard />
        )}
      </Section>

      <Section title="Albums">
        {albums.length > 0 ? (
          <ul className="space-y-3">
            {albums.map((album) => (
              <li key={album.id}>
                <AlbumRow album={album} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-[12px] font-light leading-relaxed text-white/45">
            Your past events will appear here.
          </p>
        )}
      </Section>

      <div className="flex-1 pb-8" />
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between px-5 pt-5">
      <Link
        href="/dashboard"
        aria-label="Event Camera home"
        className="flex items-center gap-2"
      >
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10"
          style={{ borderWidth: "0.5px" }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white/85"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/85">
          Event Camera
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/join"
          className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 backdrop-blur-md transition active:opacity-75"
          style={{
            borderWidth: "0.5px",
            transitionDuration: "200ms",
            transitionTimingFunction: EASE,
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 text-white/80"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" />
            <path d="M7 12h10" strokeWidth="1.5" />
          </svg>
          <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/80">
            Join
          </span>
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md transition active:opacity-75"
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
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 px-5">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/45">
          {title}
        </p>
        {action}
      </div>
      {children}
    </section>
  );
}

function NewEventAction() {
  return (
    <Link
      href="/create"
      aria-label="Create new event"
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-white/75 transition active:opacity-60"
      style={{
        borderWidth: "0.5px",
        transitionDuration: "200ms",
        transitionTimingFunction: EASE,
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M12 6v12M6 12h12" />
      </svg>
      New
    </Link>
  );
}

function formatRelativeEnd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `Tonight · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatEndedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function ActiveCard({ event }: { event: DashEvent }) {
  return (
    <Link
      href={`/event/${encodeURIComponent(event.slug)}/manage`}
      className="block rounded-2xl border border-white/10 bg-[#121214]/70 p-5 backdrop-blur-md transition active:opacity-75"
      style={{
        borderWidth: "0.5px",
        WebkitBackdropFilter: "blur(14px)",
        transitionDuration: "200ms",
        transitionTimingFunction: EASE,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white/85" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/55">
            Live
          </span>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/40">
          Ends {formatRelativeEnd(event.end_at)}
        </span>
      </div>

      <h2 className="mt-4 text-[24px] font-semibold leading-[1.1] tracking-tight">
        {event.name}
      </h2>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.24em] tabular-nums text-white/55">
        {event.photo_count} {event.photo_count === 1 ? "Photo" : "Photos"}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <FilmStrip slug={event.slug} count={5} />
        <Chevron />
      </div>
    </Link>
  );
}

function CreateEventCard() {
  return (
    <Link
      href="/create"
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#121214]/70 p-5 backdrop-blur-md transition active:opacity-75"
      style={{
        borderWidth: "0.5px",
        WebkitBackdropFilter: "blur(14px)",
        transitionDuration: "200ms",
        transitionTimingFunction: EASE,
      }}
    >
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
          No active event
        </p>
        <h2 className="mt-2 text-[20px] font-semibold tracking-tight">
          Create Event
        </h2>
        <p className="mt-1 text-[12px] font-light leading-relaxed text-white/55">
          Start a new live gallery.
        </p>
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 6v12M6 12h12" />
        </svg>
      </div>
    </Link>
  );
}

function AlbumRow({ album }: { album: DashEvent }) {
  return (
    <Link
      href={`/event/${encodeURIComponent(album.slug)}/album`}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#121214]/55 p-3 backdrop-blur-md transition active:opacity-75"
      style={{
        borderWidth: "0.5px",
        WebkitBackdropFilter: "blur(12px)",
        transitionDuration: "200ms",
        transitionTimingFunction: EASE,
      }}
    >
      <div
        aria-hidden
        className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border border-white/[0.06]"
        style={{
          backgroundColor: mockColor(album.slug, 0),
          borderWidth: "0.5px",
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold tracking-tight text-white">
          {album.name}
        </p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.24em] tabular-nums text-white/45">
          {formatEndedDate(album.end_at)} · {album.photo_count}{" "}
          {album.photo_count === 1 ? "Moment" : "Moments"}
        </p>
      </div>
      <Chevron />
    </Link>
  );
}

function FilmStrip({ slug, count }: { slug: string; count: number }) {
  return (
    <div aria-hidden className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="block h-7 w-7 rounded-[5px] border border-white/[0.06]"
          style={{
            backgroundColor: mockColor(slug, i),
            borderWidth: "0.5px",
          }}
        />
      ))}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-white/45"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
