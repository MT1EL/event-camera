# AGENTS.md — Event Camera System

## 1. Product Overview

This is a mobile-first web application for live event photography.

Users scan a QR code at an event and immediately enter a camera-first experience where they can capture and upload photos into a shared live event gallery.

Organizers create events and view all captured photos in real time.

---

## 2. Core Product Philosophy

- Camera-first experience is the core of the product
- Zero-friction guest flow (no login, no signup)
- Speed of capture is more important than features
- UI should be minimal and almost invisible during use
- Real-time feedback is essential

---

## 3. Roles

### Guest (Attendee)

- Scans QR code
- Opens camera instantly
- Takes photos
- Photos are uploaded to event gallery
- No authentication required

### Organizer

- Authenticates via Apple or Google
- Creates events
- Generates QR code
- Views live gallery

---

## 4. Hard Rules

- Guests do NOT authenticate (zero-friction join via QR)
- Organizers MUST authenticate (Apple or Google only)
- NO social features (likes, comments, messaging)
- NO editing tools in MVP
- NO complex navigation
- Guest must reach camera in <10 seconds

---

## 5. Tech Stack

- Next.js (App Router)
- Tailwind CSS
- Supabase (later phase)
- Vercel

Single repository for entire system.

---

## 6. UI Direction

Premium, cinematic, editorial design.

### Colors:

- Background: #0A0A0B
- Surface: #121214
- Elevated: #1A1A1D
- Text: white + soft gray

### Rules:

- NO neon
- NO bright saturated colors
- NO playful UI
- Minimal animations only

---

## 7. UX Principles

- Camera is primary interface
- One action per screen
- Instant feedback on all actions
- No loading screens in guest flow

---

## 8. Core Flow

Guest:
QR → Event → Camera → Capture → Instant return

Organizer:
Welcome → Sign In (Apple / Google) → Create Event → Setup → QR → Manage → Live photos

The welcome screen is the single entry point. It routes the two user types:

- Organizers tap Apple or Google to authenticate.
- Guests tap "I was invited" — they are reminded to scan the event QR code with their device camera. The app itself never authenticates a guest.

---

## 9. Live System

- Photos appear instantly (later backend)
- Event updates feel real-time

---

## 10. MVP Scope Limitations

DO NOT build:

- guest authentication (guests never sign in)
- email / password / phone-number sign-in (Apple + Google only)
- social features
- analytics
- subscriptions
- editing tools

Organizer authentication via Apple and Google IS in scope.

## UI Reference Standard

The UI must behave like a professional camera application with cinematic minimal overlays.

Reference behavior includes:

- iOS Camera App layout principles
- professional DSLR UI overlays
- minimal, non-intrusive controls
- floating translucent controls only when needed

## 11. Event Lifecycle System

Events are NOT permanent.

Every event must have:

- event name
- event end date
- reveal mode
- visibility mode
- optional guest limit

---

### Event End Date

Each event has an end date/time.

After event ends:

- guests can no longer upload photos
- organizer can still access gallery/export
- event becomes archived

Default duration may be:

- 24h
- 72h
- or custom date selection

Events must never be infinite duration.

---

### Visibility Modes

Events support two visibility modes only:

#### PRIVATE

- only organizer can see gallery

#### PUBLIC

- anyone with event link/QR can see gallery

No additional permission systems in MVP.

---

### Reveal Modes

Reveal mode controls when uploaded photos become visible.

Supported reveal modes:

#### LIVE

Photos appear immediately after upload.

#### END_OF_EVENT

Photos remain hidden until event end date.

#### SCHEDULED

Organizer selects specific reveal date/time.

Photos remain hidden until reveal timestamp.

---

### Guest Limits

Optional guest limit supported.

Default:

- unlimited guests

MVP does not require advanced attendee management.

---

### Organizer Flow

Organizer flow must be:

Create Event
→ Setup Event
→ Generate QR
→ Manage Event
→ Export Photos

---

### Setup Screen Philosophy

The setup screen is NOT an admin dashboard.

It should feel:

- lightweight
- cinematic
- mobile-first
- simple enough to configure within seconds

Avoid enterprise SaaS UI patterns.
