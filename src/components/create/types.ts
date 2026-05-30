/** Number of steps in the create-event wizard. */
export const STEPS = 4;

export type RevealMode = "live" | "end" | "scheduled";
export type Roll = "10" | "20" | "50" | "inf";
export type Visibility = "owner" | "everyone";

export const REVEAL_OPTIONS: { value: RevealMode; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "end", label: "At End" },
  { value: "scheduled", label: "Scheduled" },
];

export const ROLL_OPTIONS: { value: Roll; label: string }[] = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "inf", label: "∞" },
];

export const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "everyone", label: "Everyone" },
];

export const ROLL_SUMMARY: Record<Roll, string> = {
  "10": "10 Shots",
  "20": "20 Shots",
  "50": "50 Shots",
  inf: "Unlimited",
};

export const VISIBILITY_SUMMARY: Record<Visibility, string> = {
  owner: "Organizer only",
  everyone: "All guests",
};

/** Maps a roll selection to a numeric shot limit, or `null` for unlimited. */
export function rollToShots(r: Roll): number | null {
  return r === "inf" ? null : Number(r);
}
