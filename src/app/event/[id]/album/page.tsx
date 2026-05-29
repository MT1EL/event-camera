import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/queries/events";
import { getEventPhotos, publicPhotoUrl } from "@/lib/queries/photos";
import AlbumView, { type AlbumPhoto, type AlbumPayload } from "./album-view";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventBySlug(id);
  if (!event) notFound();

  const rows = await getEventPhotos(event.id);
  const photos: AlbumPhoto[] = rows.map((p, i) => ({
    id: p.id,
    index: rows.length - i,
    src: publicPhotoUrl(p.storage_path),
    participant: p.participant_name,
  }));

  const participantCount = new Set(rows.map((r) => r.participant_name)).size;

  const album: AlbumPayload = {
    id: event.id,
    slug: event.slug,
    name: event.name,
    endedAt: event.end_at,
    photoCount: rows.length,
    participantCount,
  };

  return <AlbumView album={album} photos={photos} />;
}
