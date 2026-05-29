"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RevealMode, VisibilityMode } from "@/lib/supabase/types";

export type UpdateEventInput = {
  id: string;
  slug: string;
  end_at: string;
  reveal_mode: RevealMode;
  reveal_at: string | null;
  shots_per_person: number | null;
  visibility: VisibilityMode;
};

export type UpdateEventResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateEventAction(
  input: UpdateEventInput,
): Promise<UpdateEventResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("events")
    .update({
      end_at: input.end_at,
      reveal_mode: input.reveal_mode,
      reveal_at: input.reveal_at,
      shots_per_person: input.shots_per_person,
      visibility: input.visibility,
    })
    .eq("id", input.id)
    .eq("owner_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/event/${input.slug}/manage`);
  return { ok: true };
}
