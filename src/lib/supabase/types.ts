export type RevealMode = "live" | "end" | "scheduled";
export type VisibilityMode = "owner" | "everyone";

export type EventRow = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  end_at: string;
  reveal_mode: RevealMode;
  reveal_at: string | null;
  shots_per_person: number | null;
  visibility: VisibilityMode;
  created_at: string;
};

export type PhotoRow = {
  id: string;
  event_id: string;
  uploader_id: string | null;
  guest_session: string | null;
  participant_name: string;
  storage_path: string;
  created_at: string;
};

export type CreateEventInput = {
  slug: string;
  name: string;
  end_at: string;
  reveal_mode: RevealMode;
  reveal_at: string | null;
  shots_per_person: number | null;
  visibility: VisibilityMode;
};

export const STORAGE_BUCKET = "event-photos";
