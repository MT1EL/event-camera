"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Ref,
} from "react";
import { usePhotos } from "../event-state";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getOrCreateGuestSession } from "@/lib/guest-session";
import { STORAGE_BUCKET } from "@/lib/supabase/types";
import ChevronIcon from "@/components/icons/ChevronIcon";
import EventEnded from "./event-ended";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const SHRINK_MS = 320;

type CameraStatus = "starting" | "ready" | "denied" | "unavailable";
type Facing = "user" | "environment";
type Shrink = { id: number; src: string };

type Identity =
  | {
      uploaderId: string;
      guestSession: null;
      name: string;
    }
  | {
      uploaderId: null;
      guestSession: string;
      name: string;
    };

export default function CameraScreen({
  eventDbId,
  eventSlug,
  eventName,
  endAt,
  shotsPerPerson,
}: {
  eventDbId: string;
  eventSlug: string;
  eventName: string;
  endAt: string;
  shotsPerPerson: number | null;
}) {
  const router = useRouter();
  const { photos, addPhoto } = usePhotos();
  const [flashSeq, setFlashSeq] = useState(0);
  const [shrinks, setShrinks] = useState<Shrink[]>([]);
  const [facing, setFacing] = useState<Facing>("environment");
  const [status, setStatus] = useState<CameraStatus>("starting");
  const [retrySeq, setRetrySeq] = useState(0);

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [myCount, setMyCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ended, setEnded] = useState(
    () => Date.now() >= new Date(endAt).getTime(),
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gallerySlotRef = useRef<HTMLAnchorElement>(null);
  const shrinkSeq = useRef(0);
  const supabaseRef = useRef<ReturnType<
    typeof createSupabaseBrowserClient
  > | null>(null);

  // Resolve identity (auth user vs anon guest) + initial photo count
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      supabaseRef.current = supabase;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      let id: Identity;
      if (user) {
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const name =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          user.email ||
          "Organizer";
        id = { uploaderId: user.id, guestSession: null, name };
      } else {
        const session = getOrCreateGuestSession();
        id = {
          uploaderId: null,
          guestSession: session.id,
          name: session.name,
        };
      }
      setIdentity(id);

      const countQuery = supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventDbId);
      const filtered = id.uploaderId
        ? countQuery.eq("uploader_id", id.uploaderId)
        : countQuery.eq("guest_session", id.guestSession);
      const { count } = await filtered;
      if (!cancelled) setMyCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventDbId]);

  // Camera lifecycle
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      setStatus("starting");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setStatus("unavailable");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          try {
            await v.play();
          } catch {
            /* autoplay may resolve later */
          }
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const name = (err as DOMException)?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("denied");
        } else {
          setStatus("unavailable");
        }
      }
    };
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, retrySeq]);

  // Close the camera the moment the event's end time passes mid-session.
  useEffect(() => {
    const remaining = new Date(endAt).getTime() - Date.now();
    if (remaining <= 0) return; // already handled by initial state
    const t = window.setTimeout(() => setEnded(true), remaining);
    return () => window.clearTimeout(t);
  }, [endAt]);

  // Release the camera stream once the event has ended.
  useEffect(() => {
    if (!ended) return;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [ended]);

  const uploadPhoto = useCallback(
    async (blob: Blob, photoId: string) => {
      const supabase = supabaseRef.current;
      if (!supabase || !identity) return;
      const path = `${eventDbId}/${photoId}.jpg`;

      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (storageError) {
        setUploadError("Upload failed. Tap again to retry.");
        return;
      }

      const { error: rowError } = await supabase.from("photos").insert({
        id: photoId,
        event_id: eventDbId,
        uploader_id: identity.uploaderId,
        guest_session: identity.guestSession,
        participant_name: identity.name,
        storage_path: path,
      });

      if (rowError) {
        setUploadError(rowError.message);
      }
    },
    [eventDbId, identity],
  );

  const handleCapture = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.videoWidth === 0 || v.videoHeight === 0) return;
    if (ended) return;
    if (shotsPerPerson !== null && myCount >= shotsPerPerson) return;
    if (!identity) return;

    const w = v.videoWidth;
    const h = v.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    // Instant UI feedback
    setFlashSeq((n) => n + 1);
    addPhoto(dataUrl);
    shrinkSeq.current += 1;
    setShrinks((prev) => [...prev, { id: shrinkSeq.current, src: dataUrl }]);
    setMyCount((c) => c + 1);
    setUploadError(null);

    // Background upload
    const photoId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    canvas.toBlob(
      (blob) => {
        if (blob) void uploadPhoto(blob, photoId);
      },
      "image/jpeg",
      0.9,
    );
  }, [
    addPhoto,
    ended,
    facing,
    identity,
    myCount,
    shotsPerPerson,
    uploadPhoto,
  ]);

  const handleSwitch = useCallback(() => {
    setFacing((f) => (f === "user" ? "environment" : "user"));
  }, []);

  const handleRetry = useCallback(() => {
    setRetrySeq((n) => n + 1);
  }, []);

  // Organizers return to manage, guests to the event landing — so the camera
  // is never a dead end. Leaving unmounts this screen and stops the stream.
  const handleExit = useCallback(() => {
    const slug = encodeURIComponent(eventSlug);
    router.push(
      identity?.uploaderId ? `/event/${slug}/manage` : `/event/${slug}`,
    );
  }, [identity, eventSlug, router]);

  const removeShrink = useCallback((id: number) => {
    setShrinks((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const latest = photos.length > 0 ? photos[photos.length - 1].src : undefined;
  const limitReached =
    shotsPerPerson !== null && myCount >= shotsPerPerson;
  const canCapture =
    status === "ready" && !limitReached && identity !== null && !ended;

  if (ended) {
    return <EventEnded eventName={eventName} eventSlug={eventSlug} />;
  }
  const counterCap =
    shotsPerPerson === null ? "∞" : String(shotsPerPerson);

  return (
    <div
      className="relative flex h-dvh w-full select-none flex-col overflow-hidden bg-[#0a0a0b] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{
          transform: facing === "user" ? "scaleX(-1)" : undefined,
          opacity: status === "ready" ? 1 : 0,
          transition: `opacity 200ms ${EASE}`,
        }}
      />
      <ViewfinderOverlay />

      <header className="relative z-10 flex items-center justify-between px-5 pt-4">
        <div className="flex w-[88px] items-center">
          <ExitButton onClick={handleExit} />
        </div>
        <h1 className="truncate text-center text-[12px] font-medium tracking-tight text-white/80">
          {eventName}
        </h1>
        <div className="flex w-[88px] items-center justify-end gap-2">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white/85" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/55">
            Live
          </span>
        </div>
      </header>

      <div className="flex-1" />

      <div className="relative z-10 px-6 pb-6">
        <p className="mb-1 text-center text-[11px] font-medium uppercase tabular-nums tracking-[0.36em] text-white/45">
          {myCount} / {counterCap}
        </p>
        {uploadError ? (
          <p
            role="alert"
            className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-white/60"
          >
            {uploadError}
          </p>
        ) : (
          <div className="mb-4 h-3" aria-hidden />
        )}
        <div className="flex items-center justify-between">
          <GallerySlot
            latest={latest}
            eventSlug={eventSlug}
            ref={gallerySlotRef}
          />
          <CaptureButton onCapture={handleCapture} disabled={!canCapture} />
          <SwitchButton
            onSwitch={handleSwitch}
            disabled={status === "starting"}
          />
        </div>
      </div>

      {(status === "denied" || status === "unavailable") && (
        <CameraStatusOverlay status={status} onRetry={handleRetry} />
      )}

      {shrinks.map((s) => (
        <ShrinkingFrame
          key={s.id}
          src={s.src}
          targetRef={gallerySlotRef}
          onDone={() => removeShrink(s.id)}
        />
      ))}

      {flashSeq > 0 && (
        <div
          key={flashSeq}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 bg-white"
          style={{ animation: `flash 140ms ${EASE} forwards` }}
        />
      )}
    </div>
  );
}

function ViewfinderOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-0 h-full w-px bg-white/[0.05]" />
        <div className="absolute left-2/3 top-0 h-full w-px bg-white/[0.05]" />
        <div className="absolute left-0 top-1/3 h-px w-full bg-white/[0.05]" />
        <div className="absolute left-0 top-2/3 h-px w-full bg-white/[0.05]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2"
      >
        <span
          className="absolute left-0 top-0 h-3 w-3 border-l border-t border-white/25"
          style={{ borderWidth: "0.5px" }}
        />
        <span
          className="absolute right-0 top-0 h-3 w-3 border-r border-t border-white/25"
          style={{ borderWidth: "0.5px" }}
        />
        <span
          className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-white/25"
          style={{ borderWidth: "0.5px" }}
        />
        <span
          className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-white/25"
          style={{ borderWidth: "0.5px" }}
        />
      </div>
    </>
  );
}

function ShrinkingFrame({
  src,
  targetRef,
  onDone,
}: {
  src: string;
  targetRef: React.RefObject<HTMLElement | null>;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const el = ref.current;
    const target = targetRef.current;
    if (!el || !target) {
      doneRef.current();
      return;
    }
    const r = target.getBoundingClientRect();
    const startW = window.innerWidth;
    const startH = window.innerHeight;

    const anim = el.animate(
      [
        {
          top: "0px",
          left: "0px",
          width: `${startW}px`,
          height: `${startH}px`,
          borderRadius: "0px",
        },
        {
          top: `${r.top}px`,
          left: `${r.left}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
          borderRadius: "10px",
        },
      ],
      { duration: SHRINK_MS, easing: EASE, fill: "forwards" },
    );
    const handleFinish = () => doneRef.current();
    anim.addEventListener("finish", handleFinish);
    return () => {
      anim.removeEventListener("finish", handleFinish);
      anim.cancel();
    };
  }, [targetRef]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed z-20"
      style={{
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0a0a0b",
        borderRadius: 0,
      }}
    />
  );
}

function GallerySlot({
  latest,
  eventSlug,
  ref,
}: {
  latest?: string;
  eventSlug: string;
  ref?: Ref<HTMLAnchorElement>;
}) {
  return (
    <Link
      ref={ref}
      href={`/event/${encodeURIComponent(eventSlug)}/gallery`}
      prefetch
      aria-label="Open gallery"
      className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.04] backdrop-blur-md transition active:opacity-75"
      style={{
        borderWidth: "0.5px",
        transitionDuration: "150ms",
        transitionTimingFunction: EASE,
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {latest ? (
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url(${latest})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
      ) : (
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
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <circle cx="12" cy="12.5" r="2.5" />
          <path d="M9 6l1-1.5h4L15 6" />
        </svg>
      )}
    </Link>
  );
}

function CaptureButton({
  onCapture,
  disabled,
}: {
  onCapture: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onCapture}
      disabled={disabled}
      aria-label="Capture photo"
      className="relative grid h-[72px] w-[72px] place-items-center rounded-full transition active:scale-95 disabled:active:scale-100"
      style={{
        transitionDuration: "150ms",
        transitionTimingFunction: EASE,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        className="absolute inset-0 rounded-full border border-white/75"
        style={{ borderWidth: "1.5px" }}
        aria-hidden
      />
      <span
        className="h-[58px] w-[58px] rounded-full bg-white/95"
        aria-hidden
      />
    </button>
  );
}

function ExitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Exit camera"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md transition active:opacity-70"
      style={{
        borderWidth: "0.5px",
        transitionDuration: "150ms",
        transitionTimingFunction: EASE,
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <ChevronIcon direction="left" className="h-4 w-4 text-white/75" />
    </button>
  );
}

function SwitchButton({
  onSwitch,
  disabled,
}: {
  onSwitch: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSwitch}
      disabled={disabled}
      aria-label="Switch camera"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md transition active:opacity-70 disabled:opacity-40"
      style={{
        borderWidth: "0.5px",
        transitionDuration: "150ms",
        transitionTimingFunction: EASE,
        WebkitBackdropFilter: "blur(10px)",
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
        <path d="M21 12a9 9 0 0 1-15.5 6.3" />
        <path d="M3 12a9 9 0 0 1 15.5-6.3" />
        <path d="M21 4v5h-5" />
        <path d="M3 20v-5h5" />
      </svg>
    </button>
  );
}

function CameraStatusOverlay({
  status,
  onRetry,
}: {
  status: "denied" | "unavailable";
  onRetry: () => void;
}) {
  const title =
    status === "denied" ? "Camera access denied" : "Camera unavailable";
  const subtitle =
    status === "denied"
      ? "Allow camera in your browser settings, then retry."
      : "No camera detected on this device.";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
      <div
        className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#121214]/80 px-6 py-7 text-center backdrop-blur-md"
        style={{ borderWidth: "0.5px", WebkitBackdropFilter: "blur(14px)" }}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
          Camera
        </p>
        <h2 className="mt-2 text-[17px] font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-2 text-[13px] font-light leading-relaxed text-white/55">
          {subtitle}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 text-[13px] font-medium tracking-tight text-white transition active:opacity-75"
          style={{
            borderWidth: "0.5px",
            transitionDuration: "200ms",
            transitionTimingFunction: EASE,
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
