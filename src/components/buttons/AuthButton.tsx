import { EASE } from "@/lib/ui";
import AppleLogo from "../icons/logos/AppleLogo";
import GoogleLogo from "../icons/logos/GoogleLogo";
import Spinner from "../Spinner";

type Provider = "apple" | "google";

export default function AuthButton({
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
