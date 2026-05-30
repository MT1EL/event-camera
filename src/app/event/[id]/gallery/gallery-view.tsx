"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import SegmentedControl from "@/components/segmented-control";
import Spinner from "@/components/Spinner";
import { getOrCreateGuestSession } from "@/lib/guest-session";
import { publicPhotoUrl } from "@/lib/photo-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PhotoRow } from "@/lib/supabase/types";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Tab = "mine" | "event";
type Identity = { uploaderId: string | null; guestSession: string | null };

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: "mine", label: "My Photos" },
  { value: "event", label: "Event Gallery" },
];

export default function GalleryView({
  eventDbId,
  eventSlug,
  eventName,
}: {
  eventDbId: string;
  eventSlug: string;
  eventName: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("mine");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[] | null>(null); // null = loading

  // Organizers return to manage, guests back to the camera to keep shooting.
  const handleClose = useCallback(() => {
    const slug = encodeURIComponent(eventSlug);
    router.push(
      identity?.uploaderId ? `/event/${slug}/manage` : `/event/${slug}/camera`,
    );
  }, [identity, eventSlug, router]);

  // Load identity + all event photos from the DB (the source of truth, so
  // "My Photos" survives reloads), and stay live via a realtime subscription.
  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setIdentity(
        user
          ? { uploaderId: user.id, guestSession: null }
          : { uploaderId: null, guestSession: getOrCreateGuestSession().id },
      );

      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", eventDbId)
        .order("created_at", { ascending: false });
      if (!cancelled) setPhotos((data ?? []) as PhotoRow[]);
    })();

    const channel = supabase
      .channel(`gallery:${eventDbId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${eventDbId}`,
        },
        (payload) => {
          const row = payload.new as PhotoRow;
          setPhotos((prev) => {
            if (!prev) return [row];
            if (prev.some((p) => p.id === row.id)) return prev;
            return [row, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [eventDbId]);

  const mine = useMemo(() => {
    if (!photos || !identity) return [];
    return photos.filter((p) =>
      identity.uploaderId
        ? p.uploader_id === identity.uploaderId
        : p.guest_session === identity.guestSession,
    );
  }, [photos, identity]);

  const loading = photos === null || identity === null;
  const visible = tab === "mine" ? mine : (photos ?? []);

  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close gallery"
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
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
            Gallery
          </span>
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
            Live Event
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-[1.05] tracking-tight">
            {eventName}
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
              className="h-3 bg-white/10"
              style={{ width: "0.5px" }}
            />
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] tabular-nums text-white/55">
              {visible.length} Photo{visible.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <SegmentedControl
            options={TAB_OPTIONS}
            value={tab}
            onChange={setTab}
          />
        </div>
      </header>

      <section
        className="mt-6 px-5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2.5rem)" }}
      >
        {loading ? (
          <div className="mt-20 flex justify-center text-white/40">
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState tab={tab} eventSlug={eventSlug} />
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {visible.map((p) => (
              <PhotoTile key={p.id} photo={p} showName={tab === "event"} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PhotoTile({
  photo,
  showName,
}: {
  photo: PhotoRow;
  showName: boolean;
}) {
  return (
    <div
      className="relative aspect-[2/3] overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#121214]"
      style={{
        borderWidth: "0.5px",
        backgroundImage: `url(${publicPhotoUrl(photo.storage_path)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-label={showName ? `Photo by ${photo.participant_name}` : "Photo"}
    >
      {showName && (
        <span
          className="absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium tracking-tight text-white/90"
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {photo.participant_name}
        </span>
      )}
    </div>
  );
}

function EmptyState({ tab, eventSlug }: { tab: Tab; eventSlug: string }) {
  const isMine = tab === "mine";
  return (
    <div className="mt-20 flex flex-col items-center gap-3 px-6 text-center">
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
        No shots yet
      </p>
      <p className="max-w-xs text-[13px] font-light leading-relaxed text-white/55">
        {isMine
          ? "Photos you capture appear here and stay saved to this device."
          : "Photos from everyone at this event will appear here."}
      </p>
      {isMine && (
        <Link
          href={`/event/${encodeURIComponent(eventSlug)}/camera`}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 text-[13px] font-medium tracking-tight text-white transition active:opacity-75"
          style={{
            borderWidth: "0.5px",
            transitionDuration: "200ms",
            transitionTimingFunction: EASE,
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          Open camera
        </Link>
      )}
    </div>
  );
}
