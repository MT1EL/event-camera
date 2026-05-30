"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import QrScanner from "qr-scanner";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Status = "starting" | "scanning" | "denied" | "unavailable" | "found";

function extractEventSlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/^\/event\/([^/]+)/);
    if (match) return decodeURIComponent(match[1]);
    return null;
  } catch {
    /* not a full URL */
  }

  const pathMatch = trimmed.match(/^\/?event\/([^/]+)/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);

  if (/^[a-z0-9_-]+$/i.test(trimmed)) return trimmed;

  return null;
}

export default function JoinView() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const navigatedRef = useRef(false);

  const [status, setStatus] = useState<Status>("starting");
  const [retrySeq, setRetrySeq] = useState(0);
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const navigateToSlug = useCallback(
    (slug: string) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      try {
        scannerRef.current?.stop();
      } catch {
        /* ignore */
      }
      router.push(`/event/${encodeURIComponent(slug)}`);
    },
    [router],
  );

  const handleDecoded = useCallback(
    (data: string) => {
      const slug = extractEventSlug(data);
      if (!slug) return;
      setStatus("found");
      navigateToSlug(slug);
    },
    [navigateToSlug],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const v = videoRef.current;
      if (!v) return;
      navigatedRef.current = false;
      setStatus("starting");

      try {
        const scanner = new QrScanner(
          v,
          (result) => {
            if (cancelled) return;
            handleDecoded(result.data);
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: false,
            highlightCodeOutline: false,
            returnDetailedScanResult: true,
            maxScansPerSecond: 8,
          },
        );

        scannerRef.current = scanner;
        await scanner.start();
        if (cancelled) {
          scanner.stop();
          scanner.destroy();
          return;
        }
        setStatus("scanning");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (
          msg.includes("permission") ||
          msg.includes("denied") ||
          msg.includes("notallowed") ||
          msg.includes("allow")
        ) {
          setStatus("denied");
        } else {
          setStatus("unavailable");
        }
      }
    })();

    return () => {
      cancelled = true;
      const sc = scannerRef.current;
      if (sc) {
        try {
          sc.stop();
        } catch {
          /* ignore */
        }
        try {
          sc.destroy();
        } catch {
          /* ignore */
        }
      }
      scannerRef.current = null;
    };
  }, [handleDecoded, retrySeq]);

  const handleRetry = useCallback(() => {
    setRetrySeq((n) => n + 1);
  }, []);

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    const slug = extractEventSlug(manualInput);
    if (!slug) {
      setManualError("That doesn't look like a valid event link.");
      return;
    }
    setManualError(null);
    navigateToSlug(slug);
  };

  const viewfinderReady = status === "scanning" || status === "found";

  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <header className="flex items-center justify-between px-5 pt-5">
        <Link
          href="/"
          aria-label="Close"
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
        </Link>
        <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
          Join Event
        </span>
        <span className="w-11" aria-hidden />
      </header>

      <div className="px-6 pt-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
          Scan to Join
        </p>
        <h1 className="mt-2 text-[24px] font-semibold leading-[1.1] tracking-tight">
          Point your camera
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-[13px] font-light leading-relaxed text-white/55">
          Point the viewfinder at the event QR code.
        </p>
      </div>

      <section className="flex flex-1 flex-col items-center justify-center px-6 pb-6 pt-8">
        <div
          className="relative aspect-[2/3] w-full max-w-[280px] overflow-hidden rounded-3xl border border-white/10 bg-black"
          style={{ borderWidth: "0.5px" }}
        >
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: viewfinderReady ? 1 : 0,
              transition: `opacity 200ms ${EASE}`,
            }}
          />
          <BracketsOverlay />
          {status === "scanning" && <ScanLine />}
          {(status === "denied" || status === "unavailable") && (
            <ScannerStatusOverlay status={status} onRetry={handleRetry} />
          )}
        </div>

        <form onSubmit={handleManualSubmit} className="mt-8 w-full max-w-sm">
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.32em] text-white/35">
            Or paste your invite link
          </p>
          <div
            className="mt-3 flex h-14 items-center rounded-full border border-white/10 bg-white/[0.04] pl-5 pr-2 backdrop-blur-md focus-within:border-white/25"
            style={{
              borderWidth: "0.5px",
              WebkitBackdropFilter: "blur(10px)",
              transition: `border-color 200ms ${EASE}`,
            }}
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                if (manualError) setManualError(null);
              }}
              placeholder="https://… or summer-gala"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              inputMode="url"
              aria-label="Event link"
              className="min-w-0 flex-1 bg-transparent text-[14px] font-medium tracking-tight text-white outline-none placeholder:font-light placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              aria-label="Join event"
              className="ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition active:opacity-80 disabled:opacity-30"
              style={{
                transitionDuration: "200ms",
                transitionTimingFunction: EASE,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          {manualError && (
            <p className="mt-3 text-center text-[11px] font-light tracking-tight text-white/55">
              {manualError}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

function BracketsOverlay() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-white/85" />
      <span className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-white/85" />
      <span className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-white/85" />
      <span className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-white/85" />
    </div>
  );
}

function ScanLine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-3 h-px bg-white/70"
      style={{
        animation: "scanLine 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        boxShadow: "0 0 14px rgba(255,255,255,0.5)",
      }}
    />
  );
}

function ScannerStatusOverlay({
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
      ? "Allow camera or paste the link below."
      : "No camera detected. Paste the link below.";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0b]/95 p-6 text-center backdrop-blur-md">
      <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/45">
        Scanner
      </p>
      <h2 className="mt-2 text-[15px] font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-[15rem] text-[12px] font-light leading-relaxed text-white/55">
        {subtitle}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-[11px] font-medium uppercase tracking-[0.24em] text-white transition active:opacity-75"
        style={{
          borderWidth: "0.5px",
          transitionDuration: "200ms",
          transitionTimingFunction: EASE,
        }}
      >
        Retry
      </button>
    </div>
  );
}
