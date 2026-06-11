"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import ScanIcon from "@/components/icons/ScanIcon";
import AuthButton from "@/components/buttons/AuthButton";

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
      const message = err instanceof Error ? err.message : "Sign-in failed.";
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
          {/* <AuthButton
            provider="apple"
            loading={signingIn === "apple"}
            disabled={anyLoading}
            onClick={() => handleSignIn("apple")}
          /> */}
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
