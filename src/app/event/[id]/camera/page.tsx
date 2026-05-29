import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/queries/events";
import CameraScreen from "./camera-screen";

export default async function CameraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventBySlug(id);
  if (!event) notFound();

  return (
    <CameraScreen
      eventDbId={event.id}
      eventSlug={event.slug}
      eventName={event.name}
      shotsPerPerson={event.shots_per_person}
    />
  );
}
