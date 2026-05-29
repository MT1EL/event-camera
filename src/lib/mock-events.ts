export type ActiveEvent = {
  id: string;
  name: string;
  endsAtLabel: string;
  photoCount: number;
};

export type Album = {
  id: string;
  name: string;
  endedAt: string;
  photoCount: number;
  participantCount: number;
};

export type AlbumPhoto = {
  id: number;
  color: string;
  participant: string;
};

export const ACTIVE_EVENT: ActiveEvent | null = {
  id: "summer-gala",
  name: "Summer Gala",
  endsAtLabel: "Tonight · 11:00 PM",
  photoCount: 42,
};

export const ALBUMS: Album[] = [
  {
    id: "spring-launch",
    name: "Spring Launch",
    endedAt: "Apr 18",
    photoCount: 87,
    participantCount: 24,
  },
  {
    id: "winter-eve",
    name: "Winter Eve",
    endedAt: "Feb 1",
    photoCount: 124,
    participantCount: 38,
  },
  {
    id: "year-end-party",
    name: "Year-End Party",
    endedAt: "Dec 28, 2025",
    photoCount: 203,
    participantCount: 56,
  },
];

const PARTICIPANT_NAMES = [
  "Alex",
  "Sam",
  "Jordan",
  "Maya",
  "Chris",
  "Riley",
  "Drew",
  "Noa",
  "Iris",
  "Kai",
  "Liam",
  "Zoe",
  "Theo",
  "Ada",
  "Eli",
  "Vera",
  "Mia",
  "Leo",
  "Ivy",
  "Owen",
  "Luna",
  "Finn",
  "Aria",
  "Caleb",
];

export function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

export function mockColor(slug: string, offset = 0): string {
  const seed = hashStr(slug || "untitled");
  const hue = (seed * 9301 + offset * 49297) % 360;
  const sat = 8 + (((seed >> (offset % 30)) + offset * 7) % 8);
  const light = 14 + (((seed >> ((offset + 1) % 30)) + offset * 13) % 12);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function getAlbumById(id: string): Album | undefined {
  return ALBUMS.find((a) => a.id === id);
}

export function getParticipant(slug: string, photoIndex: number): string {
  const seed = hashStr(slug);
  const i =
    (seed + photoIndex * 17 + (photoIndex >> 1) * 13) %
    PARTICIPANT_NAMES.length;
  return PARTICIPANT_NAMES[i];
}

export function generateAlbumPhotos(slug: string, count: number): AlbumPhoto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    color: mockColor(slug, i),
    participant: getParticipant(slug, i),
  }));
}

export function formatEventName(id: string): string {
  const decoded = decodeURIComponent(id).replace(/[-_]+/g, " ").trim();
  if (!decoded) return "Untitled Event";
  return decoded
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
