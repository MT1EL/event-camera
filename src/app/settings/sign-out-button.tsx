"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label="Sign out"
      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] text-[15px] font-medium tracking-tight text-white backdrop-blur-md transition active:opacity-75 disabled:opacity-40"
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
        <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
        <path d="M10 17l-5-5 5-5" />
        <path d="M5 12h11" />
      </svg>
      <span>{busy ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
