"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateEventInput } from "@/lib/supabase/types";

export type CreateEventResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function createEventAction(
  input: CreateEventInput,
): Promise<CreateEventResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "You must be signed in." };
  if (!input.slug || !input.name)
    return { ok: false, error: "Name is required." };
  if (!input.end_at) return { ok: false, error: "End time is required." };

  const { data, error } = await supabase
    .from("events")
    .insert({
      owner_id: user.id,
      slug: input.slug,
      name: input.name,
      end_at: input.end_at,
      reveal_mode: input.reveal_mode,
      reveal_at: input.reveal_at,
      shots_per_person: input.shots_per_person,
      visibility: input.visibility,
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That name is already used. Try a different one.",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, slug: data.slug };
}
