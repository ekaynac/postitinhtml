# postits — collaborative sticky notes for any website

- **Date:** 2026-06-23
- **Status:** Approved design (pre-implementation)
- **Repo:** `postitinhtml`
- **Packages:** `@postits/core`, `@postits/react`, `@postits/server`

## 1. Goal

An open-source, plugin-like widget that adds a polished but simple collaborative
sticky-note ("post-it") layer to **any** website with one `<script>` tag, plus a
thin React wrapper for SPA hosts. First real target: the Mega **teklif portal**
(`teklif-app` — React 18 + Vite + DevExtreme + Azure AD / MSAL).

Notes are **shared and real-time**: every visitor on the site sees and moves the
same notes live, and notes persist across sessions. The notes form a single
**global, site-wide board** — the same notes float over every page like sticky
notes stuck to the monitor.

## 2. Engine choice (and a correction)

The original idea named "html2canvas **or** playhtml" — but they solve different
problems and are not alternatives:

- **playhtml** — library-agnostic engine for interactive, **collaborative,
  persistent** HTML elements with real-time sync via a PartyKit (Yjs CRDT)
  backend. This is the foundation.
- **html2canvas** — only screenshots a DOM element to a PNG. No interactivity,
  persistence, or sync. Relevant **only** as an optional future "export board to
  PNG" feature. **Out of MVP scope.**

## 3. Decisions

| Decision | Choice |
|---|---|
| Sharing model | Shared / collaborative — everyone sees the same notes live |
| Board scope | Global, site-wide — one board, same notes on every page |
| Packaging | Vanilla `<script>` core + thin React wrapper |
| Sync backend | Self-hostable PartyKit server; `host` is configurable |
| Identity | Author name + timestamp per note; no live cursors |
| Engine | playhtml (core); html2canvas optional/deferred |

## 4. Non-goals (MVP)

- Live cursors / presence avatars / online list
- Note resizing
- Per-record / per-page boards (global only for now)
- Export to PNG (html2canvas)
- Author-only / role-based delete permissions
- Search / filtering / tags
- Rich text or attachments in notes (plain text only)

These are explicitly deferred (see §13) to keep the MVP "basic but great UX."

## 5. Architecture

**Key idea: decouple synced state from visuals.**

1. **State in the light DOM.** A single, invisible `<div can-play>` element that
   playhtml manages. Its synced data is the entire board:
   `data = { notes: Note[] }`. Because playhtml only ever manages this one
   element, we avoid any uncertainty about whether playhtml traverses Shadow DOM.
   This is the **single source of truth**.

2. **Visuals in a Shadow DOM overlay.** A fixed, full-viewport container rendered
   *purely* from `notes[]`. Shadow DOM gives bulletproof CSS isolation from the
   host site — essential because the teklif portal ships heavy DevExtreme CSS.
   The overlay is `pointer-events: none` except on notes and the toolbar, so the
   host page stays fully clickable in empty space. The overlay sits at a very
   high `z-index` so notes float above host UI.

3. **Interactions write back** to the registry via `setData(d => …)`, which
   Yjs-merges across all clients, persists, and triggers a re-render everywhere.

### Chosen approach vs. alternatives

- **A — Single synced registry + custom render + manual drag (CHOSEN).** One
  `can-play` element holds the whole `notes` array; all mutations go through
  `setData`. Clean single source of truth; identical logic in vanilla and React;
  full control over drag UX.
- **B — One `can-move` element per note.** Each note auto-gets drag/persist, but
  you still need a synced registry of which notes exist, plus runtime
  `setupPlayElement()` calls — two stores to coordinate. Rejected.
- **C — Custom WebSocket/CRDT backend, no playhtml.** Re-implements what playhtml
  gives for free. Rejected (YAGNI).

### Package layout (monorepo)

```
postitinhtml/
├─ packages/
│  ├─ core/                 @postits/core  (vanilla; IIFE/UMD → window.Postits)
│  │   └─ src/
│  │      ├─ index.ts       public API: Postits.init(config)
│  │      ├─ store.ts       wraps the can-play registry: add/edit/move/delete
│  │      ├─ render.ts      builds + updates the Shadow DOM overlay from notes[]
│  │      ├─ drag.ts        pointer drag: live local move, throttled sync, commit on drop
│  │      ├─ note.ts        Note factory, validation, clamp-to-viewport
│  │      ├─ toolbar.ts     "＋ Add note" + show/hide board toggle
│  │      ├─ identity.ts    resolve author (config callback) else "Guest"
│  │      ├─ styles.css     scoped styles injected into the shadow root
│  │      └─ types.ts
│  ├─ react/                @postits/react  (PostitsProvider wraps core, feeds MSAL identity)
│  └─ server/               @postits/server (deployable PartyKit sync server)
├─ examples/
│  ├─ vanilla/index.html    one-script-tag demo
│  └─ react-teklif/         minimal React+Vite demo mirroring portal usage
└─ docs/
```

Tooling note: Node 26 present, pnpm not installed. Workspaces can use npm or
pnpm; decide at plan time.

## 6. Data model

```ts
type Note = {
  id: string;          // crypto.randomUUID()
  text: string;        // plain text only
  x: number;           // viewport px, clamped into view on render/resize
  y: number;           // viewport px
  color: string;       // one of a small preset palette
  authorName: string;  // from identity resolver, else "Guest"
  authorId?: string;   // optional stable id (for future permissions)
  createdAt: number;   // epoch ms
  updatedAt: number;   // epoch ms
  z: number;           // stacking order; bumped on grab
};

type BoardData = { notes: Note[] };  // the can-play element's defaultData
```

Positions are stored as viewport px and **clamped into the visible viewport on
render and on `window resize`**, so notes are never lost off-screen on smaller
displays.

## 7. Sync & persistence

- playhtml syncs the registry element's `data` in real time and persists it via
  its **PartyKit** backend (Yjs CRDT).
- `Postits.init({ host })` points playhtml at a configurable PartyKit host.
- `@postits/server` is a deployable PartyKit server so Mega can **self-host** —
  teklif data never leaves Mega infra. The exact wiring of playhtml's server
  module into a self-hosted PartyKit deployment is to be confirmed during
  implementation (see §12).

## 8. Rendering & interaction

- **Toolbar** (fixed, bottom corner): "＋ Add note" and a show/hide board toggle.
- **Create:** clicking "＋ Add note" adds a `Note` near the viewport center with
  the default color and the resolved author.
- **Edit:** clicking a note's body switches it to an editable `<textarea>`;
  commit on blur / Esc updates `text` + `updatedAt`.
- **Drag:** pointer events. During drag, move the note locally via CSS transform
  for smoothness; **throttle** commits to the synced store (~50 ms) so others see
  near-live motion without flooding the backend; final position committed on drop.
  Grabbing a note bumps its `z` (bring-to-front).
- **Delete:** an `×` appears on hover; deleting removes the note from `notes[]`
  with a brief **undo** affordance.
- **Color:** a small swatch row (4–5 preset colors) per note.
- Each note shows the **author label + relative timestamp** ("by Ada · 2m ago").

## 9. Identity

`Postits.init({ identity })` accepts a resolver that returns the current user's
display name (and optional id). On the teklif portal, `@postits/react`'s
`PostitsProvider` feeds the Azure AD `displayName` from MSAL. On generic sites
with no resolver, the author falls back to `"Guest"` (optionally a name the user
types once, stored in localStorage).

## 10. Security

Notes are user-authored content rendered on **every** visitor's screen — a stored
XSS surface.

- Render note text with `textContent` only; **never** `innerHTML`.
- Validate note shape and text length at the boundary (factory + on inbound
  sync).
- No secrets in the widget; `host` is the only required config and is non-secret.

## 11. Concurrency, errors, accessibility

- **Concurrency:** Yjs merges per field/note, so simultaneous drags of *different*
  notes don't clobber each other. Concurrent edits to the *same* note are
  last-write-wins — acceptable for sticky notes.
- **Errors / offline:** if the backend is unreachable, Yjs keeps local state, so
  the widget still works locally and syncs on reconnect. Show a small,
  non-blocking "offline" indicator. Validate config at `init` and fail with clear
  console errors; never silently swallow.
- **Accessibility:** toolbar buttons are real `<button>`s with labels; notes are
  keyboard-focusable; drag has a keyboard fallback (arrow keys nudge a focused
  note). Respect `prefers-reduced-motion`.

## 12. To confirm during implementation

- Exact mechanism to self-host playhtml's PartyKit server in `@postits/server`.
- Whether to store positions as px (chosen) vs. percentage for very different
  screen sizes — px + clamp is the MVP choice; revisit if it feels wrong.
- IIFE/UMD build settings so `window.Postits` works on any site.

## 13. Deferred / future

Live cursors & presence · note resizing · per-record or per-page boards ·
export-to-PNG via html2canvas · author-only/role-based delete permissions ·
search/tags · rich text.

## 14. Testing strategy

Per project standards (TDD, 80%+ coverage):

- **Unit:** pure functions — `note` factory, validation, clamp-to-viewport, drag
  math, identity resolution.
- **Integration:** `store` CRUD over a mocked playhtml handler (add/edit/move/
  delete mutate `notes[]` correctly).
- **E2E (Playwright):** two browser contexts — create a note in one and assert it
  appears in the other; drag/edit/delete sync; reload persists. This is the test
  that proves the collaborative core.
