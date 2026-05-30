import { notFound } from "next/navigation";
import { getEventBySlug, isEventEnded } from "@/lib/queries/events";
import CameraScreen from "./camera-screen";
import EventEnded from "./event-ended";

export default async function CameraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventBySlug(id);
  if (!event) notFound();

  if (isEventEnded(event.end_at)) {
    return <EventEnded eventName={event.name} eventSlug={event.slug} />;
  }

  return (
    <CameraScreen
      eventDbId={event.id}
      eventSlug={event.slug}
      eventName={event.name}
      endAt={event.end_at}
      shotsPerPerson={event.shots_per_person}
    />
  );
}
