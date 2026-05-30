const ID_KEY = "event-camera:guest-session";
const NAME_KEY = "event-camera:guest-name";
const ADJECTIVES = [
  "Sleepy",
  "Sunny",
  "Tiny",
  "Happy",
  "Cozy",
  "Golden",
  "Sparkly",
  "Lucky",
  "Bouncy",
  "Chill",
  "Shiny",
  "Cheerful",
  "Sweet",
  "Dreamy",
];

const NOUNS = [
  "Panda",
  "Otter",
  "Koala",
  "Bunny",
  "Fox",
  "Penguin",
  "Bear",
  "Mochi",
  "Cloud",
  "Cupcake",
  "Peach",
  "Seal",
  "Duckling",
  "Capybara",
];

/** Stable fallback name derived from the session id (used when the guest hasn't named themselves). */
function nameFor(sessionId: string): string {
  let h = 5381;
  for (let i = 0; i < sessionId.length; i++) {
    h = ((h << 5) + h + sessionId.charCodeAt(i)) >>> 0;
  }
  return `${ADJECTIVES[h % ADJECTIVES.length]} ${NOUNS[h % NOUNS.length]}`;
}

function ensureSessionId(): string {
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    try {
      window.localStorage.setItem(ID_KEY, id);
    } catch {
      /* private mode — best effort */
    }
  }
  return id;
}

/** The custom name the guest typed, or empty string if none is set. */
export function getStoredGuestName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY)?.trim() ?? "";
}

/** Persists (or clears, when blank) the guest's chosen display name. */
export function setGuestName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  try {
    if (trimmed) {
      window.localStorage.setItem(NAME_KEY, trimmed);
    } else {
      window.localStorage.removeItem(NAME_KEY);
    }
  } catch {
    /* private mode — best effort */
  }
}

/** Resolves the guest's session id and display name (chosen name, else friendly fallback). */
export function getOrCreateGuestSession(): { id: string; name: string } {
  if (typeof window === "undefined") return { id: "", name: "" };
  const id = ensureSessionId();
  const custom = getStoredGuestName();
  return { id, name: custom || nameFor(id) };
}
