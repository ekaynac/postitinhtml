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
  identity?: () => { name: string; id?: string }; // author resolver
  palette?: string[];                             // note colors
  boardId?: string;                               // registry element id
};
```

## Self-hosting the sync server

`@postits/server` is a Cloudflare Workers + Durable Objects server (via
`y-partyserver`) with built-in persistence:

```bash
cd packages/server
npx wrangler dev      # local: http://localhost:8787
npx wrangler deploy   # deploy to your Cloudflare account
```

Then set `host` to your deployed URL. See `packages/server/README.md`.

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

## License

[MIT](./LICENSE)
