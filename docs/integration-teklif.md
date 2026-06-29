# Integrating postits into the Mega teklif portal (Azure AD identity)

How `@postits/react` is wired into the teklif portal (`teklif-app`, at
`../teklif_is_akisi`) so the collaborative sticky-note board runs inside the
authenticated app, authored by the signed-in Azure AD user.

Status: integration code is written and **build-verified** (the postits module
chain compiles in teklif-app's Vite). The interactive Azure AD login smoke test
(below) is the remaining manual step and requires a human with portal access.

---

## Packaging decision (the one real blocker, resolved)

`@postits/react` ships **compiled JS + d.ts** from `dist/` (tsup: ESM + CJS +
types, with `react`/`react-dom`/`@postits/core` kept external as peers). This lets
a Vite **JavaScript** app like the portal consume it without a TSX toolchain.

- Build it before linking: `npm run build -w @postits/react` (and `-w @postits/core`).
- `packages/react/package.json` points `main`/`module`/`types`/`exports` at `dist/`
  with types-first conditional exports.

(Alternative strategies — Vite-transpile the linked TSX, or hand-roll a provider
in the portal — were rejected in favour of shipping compiled output.)

## Dev linking (sibling-repo checkout)

The portal and this repo are sibling folders:
`~/Github/postitinhtml` and `~/Github/teklif_is_akisi`.

From the monorepo root, build, then link into the portal:
```bash
npm run build -w @postits/core
npm run build -w @postits/react
cd ../teklif_is_akisi
npm install ../postitinhtml/packages/core ../postitinhtml/packages/react --legacy-peer-deps
```

Notes:
- `--legacy-peer-deps` is required by a **pre-existing** peer conflict in teklif-app
  (`@vitejs/plugin-basic-ssl@2.3.0` wants Vite ^6+, the app pins Vite 5). Unrelated
  to postits; the portal's own installs already need this flag.
- This adds **relative** `file:` deps:
  ```json
  "@postits/core":  "file:../postitinhtml/packages/core",
  "@postits/react": "file:../postitinhtml/packages/react"
  ```
  Relative-sibling, so it works for anyone with both repos checked out side by side.
  npm symlinks them; `@postits/core`'s `playhtml` dependency resolves via the
  symlink realpath (this repo's `node_modules/playhtml`).
- **Before merging the portal branch to its main:** replace the `file:` deps with
  published package versions (npm registry or a committed tarball). `file:` paths
  are a dev convenience, not a deployable dependency.

## Code changes in teklif-app (branch `feature/postits-integration`)

1. `src/PortalPostits.jsx` — identity-fed provider mount:
   ```jsx
   import { PostitsProvider } from '@postits/react'
   import { useMsal } from '@azure/msal-react'
   import { getUserClaims } from './auth/msalConfig'

   export default function PortalPostits() {
     useMsal() // re-render on account change
     const claims = getUserClaims()
     const name = claims?.name || claims?.email || 'Guest'
     const id = claims?.oid
     return (
       <PostitsProvider config={{
         host: import.meta.env.VITE_POSTITS_HOST,
         identity: () => ({ name, id }),
       }} />
     )
   }
   ```
   Uses the portal's existing `getUserClaims()` (`src/auth/msalConfig.js`), which
   returns `{ oid, email, name, given_name, family_name, tid }`. `name` is the AD
   display name (author label); `oid` is the stable Azure object id (identity `id`).

2. `src/App.jsx` — render it **once** inside the authenticated `NotebookLayout`
   shell, as a sibling of `<Routes>` so the global board persists across routes:
   ```jsx
   import PortalPostits from './PortalPostits'
   // …
   <NotebookLayout>
     <PortalPostits />
     <Routes> … </Routes>
   </NotebookLayout>
   ```
   `<AuthGuard>` already gates `<App />`, so identity is present at mount.

3. `vite.config.js` — dedupe React for the linked packages (avoids a duplicate
   React instance breaking hooks):
   ```js
   resolve: { dedupe: ["react", "react-dom"] },
   ```

4. `.gitignore` — add `.env*.local` (Vite convention; was missing).

5. `.env.local` (gitignored, not committed):
   ```
   VITE_POSTITS_HOST=localhost:8787
   ```
   When unset, core falls back to playhtml's hosted backend (prototyping only).
   Mega sets this to its self-hosted `@postits/server`.

## Running the self-hosted server (dev)

From this repo: `npm run dev -w @postits/server` → wrangler on `localhost:8787`.
(See `packages/server/README.md` for Cloudflare deploy.)

## Build verification (done)

- Isolated probe build (a temp entry importing only `@postits/react` + `@postits/core`)
  compiled cleanly: 18 modules, ~250 kB bundle including playhtml — proving the
  `@postits/react → @postits/core → playhtml` resolution chain works in teklif-app's
  Vite via the symlinked deps + `resolve.dedupe`.
- A full app build reaches and compiles `App.jsx` → `PortalPostits.jsx` (the postits
  import chain resolved) before failing on **pre-existing, unrelated** portal issues
  (see below).

## Pre-existing teklif-app issues found (NOT caused by postits, NOT fixed here)

Surfaced while build-verifying; flag to the portal owners:
1. **Root `index.html` is an h5ai directory-listing page**, not the Vite entry — it
   has no `<script type="module" src="/src/main.jsx">`. Committed at `460e4c4`
   ("live snapshot"). `vite build` therefore transforms only the HTML, never the app.
2. **Missing component** `src/components/altin/IlgiliKisilerPanel` imported by
   `src/pages/TeklifDetay.jsx:12` — the file does not exist; a full build errors here.

Both block teklif-app's own production build independent of postits.

## Smoke test (manual — requires Azure AD login; hand-off)

With the server running and `.env.local` set:
```bash
cd ../teklif_is_akisi && npm run dev   # https://localhost:3001
```
Log in via Azure AD, then verify:
- [ ] postits toolbar ("＋ Note" / Hide) floats above the portal.
- [ ] A created note shows YOUR Azure AD display name as author.
- [ ] Notes persist on reload (server persistence).
- [ ] A second user (other browser/incognito) sees the note sync live.
- [ ] DevExtreme UI is visually unaffected (Shadow-DOM isolation) and empty areas
      stay clickable (overlay is `pointer-events: none`; only notes/toolbar interactive).
- [ ] No z-index conflict with DevExtreme modals (postits `OVERLAY_Z_INDEX = 2147483000`).

If z-index / click-through conflicts with DevExtreme appear, record them as
follow-ups — do not patch core ad-hoc from the portal.

## Definition of done

- [x] `@postits/react` ships compiled `dist/` (consumable by a Vite JS app).
- [x] `PortalPostits.jsx` created; mounted once in the authenticated shell.
- [x] `VITE_POSTITS_HOST` documented; React deduped; `.env*.local` ignored.
- [x] postits module chain build-verified in teklif-app's Vite.
- [ ] Interactive Azure AD smoke test (manual, pending portal access).
- [ ] Replace `file:` deps with published versions before merging the portal branch.
