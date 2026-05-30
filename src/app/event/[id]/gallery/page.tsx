import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/queries/events";
import GalleryView from "./gallery-view";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventBySlug(id);
  if (!event) notFound();

  return (
    <GalleryView
      eventDbId={event.id}
      eventSlug={event.slug}
      eventName={event.name}
    />
  );
}
