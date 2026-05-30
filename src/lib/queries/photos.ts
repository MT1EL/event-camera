import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PhotoRow } from "@/lib/supabase/types";

export { publicPhotoUrl } from "@/lib/photo-url";

export async function getEventPhotos(eventId: string): Promise<PhotoRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PhotoRow[];
}

export function tallyParticipants(
  photos: PhotoRow[],
): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of photos) {
    map.set(p.participant_name, (map.get(p.participant_name) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) =>
      b.count !== a.count ? b.count - a.count : a.name.localeCompare(b.name),
    );
}
