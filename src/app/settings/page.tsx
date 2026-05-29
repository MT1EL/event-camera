import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email ||
    "Account";
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  const email = user.email ?? "";

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
          Settings
        </span>
        <span className="w-11" aria-hidden />
      </header>

      <section className="px-5 pt-8">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.36em] text-white/45">
          Account
        </p>
        <div
          className="mt-3 flex items-center gap-4 rounded-2xl border border-white/10 bg-[#121214]/70 p-4 backdrop-blur-md"
          style={{
            borderWidth: "0.5px",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-12 w-12 shrink-0 rounded-full border border-white/[0.08] object-cover"
              style={{ borderWidth: "0.5px" }}
            />
          ) : (
            <div
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[13px] font-semibold tracking-tight text-white/85"
              style={{ borderWidth: "0.5px" }}
            >
              {initialsOf(name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-tight text-white">
              {name}
            </p>
            {email && (
              <p className="mt-0.5 truncate text-[12px] font-light text-white/55">
                {email}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex-1" />

      <div className="px-5 pb-8">
        <SignOutButton />
        <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.32em] text-white/30">
          Event Camera
        </p>
      </div>
    </main>
  );
}
