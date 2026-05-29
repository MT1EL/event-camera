import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/supabase/types";

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data as EventRow | null) ?? null;
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return (data as EventRow | null) ?? null;
}

export async function getOwnerEvents(ownerId: string): Promise<{
  active: EventRow[];
  albums: EventRow[];
}> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  const events = (data ?? []) as EventRow[];
  const now = new Date().toISOString();
  return {
    active: events.filter((e) => e.end_at > now),
    albums: events.filter((e) => e.end_at <= now),
  };
}
