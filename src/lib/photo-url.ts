import { STORAGE_BUCKET } from "@/lib/supabase/types";

/** Builds the public URL for a stored photo. Isomorphic — safe in client & server. */
export function publicPhotoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
}
