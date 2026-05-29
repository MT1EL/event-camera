const KEY = "event-camera:guest-session";

const FRIENDLY_NAMES = [
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

function nameFor(sessionId: string): string {
  let h = 5381;
  for (let i = 0; i < sessionId.length; i++) {
    h = ((h << 5) + h + sessionId.charCodeAt(i)) >>> 0;
  }
  return FRIENDLY_NAMES[h % FRIENDLY_NAMES.length];
}

export function getOrCreateGuestSession(): { id: string; name: string } {
  if (typeof window === "undefined") return { id: "", name: "" };
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* private mode — best effort */
    }
  }
  return { id, name: nameFor(id) };
}
