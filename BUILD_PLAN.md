---

# 📄 `BUILD_PLAN.md`

```md
# BUILD PLAN — EVENT CAMERA MVP

## Goal
Build working camera-first event capture experience.

---

## Phase 1 — FE Prototype

### Step 1

Setup Next.js + Tailwind project

---

### Step 2

Build /event/[id]

- simple landing page
- CTA to camera

---

### Step 3

Build /camera screen

- fullscreen layout
- capture button
- counter display

---

### Step 4

Implement capture logic

- flash animation
- add photo to state
- instant UI update

---

### Step 5

Add thumbnail animation

- image shrinks into icon

---

### Step 6

Build /create page

- event name input
- create button

---

### Step 7

Build /manage page (mock UI)

- photo grid
- event info

---

### Step 8

Build /qr page (static UI)

---

### Step 9

Test full mobile flow

- event → camera → capture loop

---

### Step 10

Polish UX

- reduce friction
- refine spacing
- improve feel

---

### Step 11

Build / (Welcome) screen

- Continue with Apple (stub)
- Continue with Google (stub)
- "I was invited" secondary path → in-place attendee guidance
- After stubbed sign-in: route to /create

---

## Phase 2 (later)

- Supabase integration
- real uploads
- realtime updates
- real OAuth — Apple & Google sign-in for organizers
  (Sign in with Apple, Google OAuth via Supabase Auth or NextAuth;
   guests remain unauthenticated)

---

## Phase 3 (later)

- payments (Stripe)
- event monetization
