import GalleryView from "./gallery-view";

function formatEventName(id: string) {
  const decoded = decodeURIComponent(id).replace(/[-_]+/g, " ").trim();
  if (!decoded) return "Untitled Event";
  return decoded
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GalleryView eventId={id} eventName={formatEventName(id)} />;
}
