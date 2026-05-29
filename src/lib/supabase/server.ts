import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase env vars are missing. ${
        !url ? "NEXT_PUBLIC_SUPABASE_URL " : ""
      }${!key ? "NEXT_PUBLIC_SUPABASE_ANON_KEY " : ""}` +
        "is not set. Add to .env.local and restart `npm run dev`.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can't set cookies — middleware handles refresh.
        }
      },
    },
  });
}
