"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Provider = "apple" | "google";

export default function Home() {
  const [signingIn, setSigningIn] = useState<Provider | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async (provider: Provider) => {
    if (signingIn) return;
    setSigningIn(provider);
    setAuthError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setAuthError(error.message);
        setSigningIn(null);
      }
      // On success the browser navigates to the provider — no further action.
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed.";
      setAuthError(message);
      setSigningIn(null);
    }
  };

  const anyLoading = signingIn !== null;

  return (
    <main
      className="relative flex min-h-dvh flex-col bg-[#0a0a0b] text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <section className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-xs flex-col items-center gap-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-white/35">
            Welcome
          </p>
          <h1 className="text-[34px] font-semibold leading-[1.05] tracking-tight">
            Event Camera
          </h1>
          <p className="text-[13px] font-light leading-relaxed text-white/55">
            A camera-first gallery for live events.
          </p>
        </div>
      </section>

      <div className="px-5 pb-8 flex flex-col gap-3">
        {/* SECONDARY — organizer auth */}
        <div className="flex gap-3">
          <AuthButton
            provider="apple"
            loading={signingIn === "apple"}
            disabled={anyLoading}
            onClick={() => handleSignIn("apple")}
          />
          <AuthButton
            provider="google"
            loading={signingIn === "google"}
            disabled={anyLoading}
            onClick={() => handleSignIn("google")}
          />
        </div>
        {authError && (
          <p
            role="alert"
            className="text-center text-[11px] font-light leading-relaxed text-white/55"
          >
            {authError}
          </p>
        )}
        <Link
          href="/join"
          aria-disabled={anyLoading}
          tabIndex={anyLoading ? -1 : 0}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white/[0.04] text-[16px] font-semibold tracking-tight text-white transition active:opacity-90"
          style={{
            transitionDuration: "200ms",
            transitionTimingFunction: EASE,
            opacity: anyLoading ? 0.4 : 1,
            pointerEvents: anyLoading ? "none" : undefined,
          }}
        >
          <ScanIcon />
          Join Event
        </Link>
      </div>
    </main>
  );
}

function AuthButton({
  provider,
  loading,
  disabled,
  onClick,
}: {
  provider: Provider;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const label = provider === "apple" ? "Apple" : "Google";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-busy={loading}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white text-[14px] font-medium tracking-tight text-black backdrop-blur-md transition active:opacity-75 disabled:opacity-40"
      style={{
        borderWidth: "0.5px",
        transitionDuration: "200ms",
        transitionTimingFunction: EASE,
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {loading ? (
          <Spinner />
        ) : provider === "apple" ? (
          <AppleLogo />
        ) : (
          <GoogleLogo />
        )}
      </span>
      <span>{loading ? "Signing in…" : label}</span>
    </button>
  );
}

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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
  );
}

function AppleLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.6z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC04"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}
