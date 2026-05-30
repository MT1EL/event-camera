type Direction = "up" | "down" | "left" | "right";

const PATHS: Record<Direction, string> = {
  up: "M6 15l6-6 6 6",
  down: "M18 9l-6 6-6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
};

export default function ChevronIcon({
  direction,
  className = "h-4 w-4",
}: {
  direction: Direction;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[direction]} />
    </svg>
  );
}
