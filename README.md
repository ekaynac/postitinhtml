# postits

Collaborative sticky notes for **any** website. Drop in one `<script>` tag (or a
React component) and visitors can pin, drag, edit, and color real-time-synced
notes that persist across sessions — a shared bulletin board that floats over
your page.

Built on [playhtml](https://github.com/spencerc99/playhtml) (Yjs CRDT sync) with
a self-hostable [PartyKit](https://www.partykit.io/)-style server, so your notes
can live entirely on your own infrastructure.

## Features

- **Real-time + persistent** — everyone on the site sees and moves the same
  notes live; they survive reloads.
- **Drop-in** — one IIFE `<script>` global for any site, plus a thin React
  wrapper.
- **Style-isolated** — the board renders in a Shadow-DOM overlay, so it never
  collides with your CSS, and empty areas of your page stay clickable.
- **Self-hostable sync** — point it at your own server; data never leaves your
  infra.
- **Author + timestamp** — pluggable identity resolver (e.g. your SSO display
  name), with a `Guest` fallback.
- **Author-scoped editing** — you can edit, recolour, and delete only your *own*
  notes; everyone else's are read-only (you can still move and read them).
- **Smooth collaborative drag** — the note you drag follows the cursor directly,
  while others see it move live; in-progress typing is never interrupted by a
  remote update (the board reconciles in place rather than redrawing).
- **XSS-safe** — note text is rendered as text, never HTML.

## Install

```bash
npm install @postits/core          # vanilla / any framework
npm install @postits/react react   # React wrapper (optional)
```

## Usage

### Script tag (any website)

```html
<script src="https://unpkg.com/@postits/core/dist/index.global.js"></script>
<script>
  Postits.init({
    host: "your-postits-server.example.com", // your self-hosted sync server
    identity: () => ({ name: "Ada" }),        // optional; falls back to "Guest"
  });
</script>
```

### React

```tsx
import { PostitsProvider } from "@postits/react";

function App() {
  return (
    <PostitsProvider config={{ host: "your-postits-server.example.com" }}>
      {/* your app */}
    </PostitsProvider>
  );
}
```

### Config

```ts
type PostitsConfig = {
  host?: string;                                  // sync server host; omit for playhtml's hosted backend
  room?: string;                                  // scope/isolate a board
  identity?: () => { name: string; id?: string }; // author resolver (id drives author-scoped editing)
  palette?: string[];                             // note colors
  boardId?: string;                               // registry element id
};
```

If the sync server is reached through the same domain that serves your page
(e.g. behind the same nginx, on a `/parties/` route), pass
`host: window.location.host` — it then works by hostname or IP without baking a
host in at build time, and uses `wss://` automatically on an `https://` page.

## Self-hosting the sync server

`@postits/server` is a Cloudflare Workers + Durable Objects server (via
`y-partyserver`) with built-in persistence:

```bash
cd packages/server
npx wrangler dev      # local: http://localhost:8787
npx wrangler deploy   # deploy to your Cloudflare account
```

**Off Cloudflare** (your own VM/box): a `Dockerfile` + `docker-compose.yml` run
the same worker via `workerd` and persist notes to a volume —
`docker compose up -d --build`. Reverse-proxy `wss://<host>/parties/` to it with
`packages/server/nginx-parties.conf`. Then set `host` accordingly. See
`packages/server/README.md`.

## Packages

| Package          | What it is                                              |
| ---------------- | ------------------------------------------------------- |
| `@postits/core`  | Framework-agnostic widget (vanilla + IIFE global)       |
| `@postits/react` | Thin `PostitsProvider` React wrapper                    |
| `@postits/server`| Self-hostable y-partyserver sync server                 |

## Development

```bash
npm install
npm test                 # unit (Vitest + jsdom)
npm run build            # build all packages (tsup)
cd e2e && npx playwright test   # two-client sync + persistence E2E
```

## Notes

- **HTTPS pages use `wss://` automatically.** playhtml's bundled provider picks
  `ws://` for private-IP hosts, which an `https://` page blocks as mixed content.
  A small patch (`patches/playhtml+*.patch`, applied via `patch-package` on
  `postinstall`) makes it follow the page protocol. If you self-host over HTTPS,
  keep that patch.

## License

[MIT](./LICENSE)
