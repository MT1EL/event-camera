# FE_SPEC.md — Frontend Behavior System

## 1. Purpose

Defines frontend behavior ONLY for FE prototype phase.

No backend logic assumed.

---

## 2. Core Goal

The app must feel like a native camera experience.

Focus:

- instant response
- immersive UI
- minimal interface

---

## 3. Screens

### / (Welcome)

App entry point. Routes the two user types — guest (attendee) vs organizer.

Visual hierarchy (top to bottom in the action zone):

- PRIMARY action: "Join Event" — large solid white pill with QR icon, routes to /join. Most prominent action on the screen because attendees vastly outnumber organizers.
- Divider with "Organizer" label.
- SECONDARY actions: Continue with Apple, Continue with Google (organizer auth).

Behavior:

- "Join Event" → /join (live QR scanner + manual link entry).
- Apple / Google taps simulate auth (FE prototype) and route to /create.
- Only one auth provider may be in-flight at a time; the other disables while signing in.
- No guest ever authenticates from this screen.

---

### /dashboard

Organizer home after authentication.

Layout:

- Header: app logo (left) + Join button (right, links to /join).
- "Active" section:
  - If there is an active event → a glass card showing event name, live indicator, end label, photo count, and a small horizontal film strip of recent photos. Tapping the card navigates to /event/[id]/manage.
  - If there is no active event → a "Create Event" card with a circular + CTA, links to /create.
- "Albums" section:
  - List of past events. Each row: small mock thumbnail + name + (date · moment count) + chevron. Tapping a row navigates to /event/[id]/album.
  - Empty state: short caption "Your past events will appear here."

Phase 1 prototype uses mock data for active event and albums. Sign-in from / routes here.

---

### /event/[id]/album

Archived event view. Reached by tapping a row in the dashboard "Albums" section.

Must include:

- close (X) link back to /dashboard
- ALBUM eyebrow + MEMORY label + event name (large title)
- meta line: `{photoCount} Moments · {participantCount} People · Ended {date}` — `People` is tappable and opens a bottom-sheet list of participants (name + per-person moment count, sorted by count descending, swipe-down to dismiss)
- Send / Save actions sit IMMEDIATELY UNDER the meta line (not in a sticky footer):
  - **Send** (primary, white pill) — invokes `navigator.share` when available, falls back to clipboard. Flashes "Sent" on success.
  - **Save** (secondary, glass pill) — Phase 2 will trigger a ZIP download. Prototype flashes "Saved".
- 2-column photo grid (square tiles) with the participant's name in the bottom-left corner of each tile (translucent dark chip + blur)

Rationale: the album is browsing-first, so a sticky footer would compete with content. Pairing the actions with the meta line keeps them discoverable without dominating the screen — same idiom as iOS Photos / Apple Memories.

Photo count uses the editorial word "Moments" instead of "Photos" to match the album/memory framing.

---

### /join

QR scanner entry point for attendees. Reached from the welcome screen.

Must include:

- close (X) link back to /
- live camera viewfinder with corner brackets + animated scan line
- manual entry: input + submit button (for users who can't scan)
- inline failure card (camera denied / unavailable) inside the viewfinder slot — manual input always remains visible

Behavior:

- Scanner auto-starts on mount with the rear camera (`facingMode: environment`).
- On successful decode of a URL matching `/event/<slug>`: route to `/event/<slug>`. Bare slugs are also accepted.
- Manual submit applies the same parsing.
- Invalid manual input shows a soft inline error; invalid scans are silently ignored (scanner keeps reading).
- Camera stream torn down on unmount and on successful navigation.

---

### /event/[id]

- Event name
- Subtitle: “Capture moments from {event}”
- Button: Enter Camera

---

### /event/[id]/camera

Core screen.

Must include:

- fullscreen camera (mock allowed)
- capture button
- optional flash toggle
- optional camera switch icon
- photo counter (e.g. 3 / 20)

---

### /create

Multi-step event creation flow, reached from the dashboard "+ Create Event" card. Single route with internal step state — browser back exits to /dashboard, the in-flow back arrow returns to the previous step.

Steps:

1. **Event Name** — text input, live `/event/<slug>` preview, Continue (disabled until non-empty slug).
2. **End Time** — native `datetime-local` picker, summary line ("Today · 11:00 PM" / "Tomorrow · 2:30 AM" / etc.), Continue.
3. **Reveal** — segmented control: `Live` (default), `At End`, `Scheduled`. Selecting `Scheduled` reveals a datetime picker below. Continue is disabled until the scheduled time is set.
4. **Capacity & Access** — two glass cards: `Shots Per Person` (10 / 20 / 50 / ∞) and `Visibility` (Owner / Everyone). Primary action is "Create Event".

UX rules:

- One action per screen (AGENTS §7).
- Steps slide horizontally on a 400% strip via `translateX` + 360ms cubic-bezier easing.
- Progress indicator: 4 dots, the current one expands into a small pill (Apple-onboarding idiom).
- Top-left button is `×` on step 1 (cancel → /dashboard), `←` on steps 2–4 (previous step).
- On "Create Event" → navigate to `/event/[slug]/manage` so the organizer can immediately get the QR.

---

### /event/[id]/manage

- event title
- photo grid (mock)
- photo count
- link to QR page

---

### /event/[id]/qr

- QR display
- share link

---

## 4. Capture Interaction

On capture:

1. flash animation (100–150ms)
2. add image to state
3. thumbnail shrink animation
4. update counter
5. return instantly to camera

No loading screens.

---

## 5. State (FE ONLY)

```ts
const [photos, setPhotos] = useState<string[]>([]);
```

## 9. UI VISUAL SYSTEM (STRICT IMPLEMENTATION RULE)

All UI must follow this exact visual system:

---

### Background System

- Primary background: #0a0a0b
- Secondary surfaces: #121214
- Elevated surfaces: #1a1a1d
- No gradients unless extremely subtle (opacity < 10%)

---

### Border System

- Default border: 0.5px solid rgba(255,255,255,0.08)
- Active border: rgba(255,255,255,0.2)
- No hard black/white borders

---

### Glass / Blur System

- Use backdrop-filter: blur(8px–14px)
- Overlay opacity range: 0.4–0.8 max
- Must feel like “camera overlay UI”

---

### Typography System

- Font: Inter or system (SF Pro style)
- Weights:
  - 300 (secondary text)
  - 400 (labels)
  - 500 (UI elements)
  - 600 (titles)
- No bold-heavy UI

---

### Button System

#### Primary Action (Capture button)

- circular
- center bottom placement
- minimal border ring
- inner fill subtle white

#### Secondary Actions (icons)

- circular buttons (44–50px)
- semi-transparent background
- subtle hover/active opacity shift

---

### Animation System

- Flash: 100–150ms max
- Transitions: 150–300ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- No bounce, no elastic motion
- Everything must feel “instant but smooth”

---

### Camera UI Layout Rules

- Top bar minimal (status + event name only)
- Bottom bar always contains:
  - gallery
  - capture
  - camera switch
- Center area must be empty (camera focus)

---

### Interaction Principle

UI must never compete with camera content.
Camera is always dominant element.
