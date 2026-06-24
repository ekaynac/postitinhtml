# @postits/server

Self-hostable Yjs sync server for the `postits` sticky-note library. Runs on [Cloudflare Workers Durable Objects](https://developers.cloudflare.com/durable-objects/) via [`y-partyserver`](https://github.com/cloudflare/partykit/tree/main/packages/y-partyserver).

## Architecture

`playhtml` (the CRDT engine used by `@postits/core`) bundles `y-partyserver`'s `YProvider` client, which connects to `/parties/main/<room>` over WebSocket using the standard [Yjs sync protocol](https://github.com/yjs/y-protocols). This server is the matching Durable Object backend.

## Prerequisites

- A Cloudflare account (free tier is sufficient for most use-cases)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) authenticated: `npx wrangler login`

## Local Development

```bash
cd packages/server
npx wrangler dev
# Server starts at http://localhost:8787
```

Point the postits client at the local server:

```ts
Postits.init({ host: "localhost:8787", room: "my-room" });
```

## Deployment to Cloudflare (Mega's account)

```bash
cd packages/server
npx wrangler deploy
# Output: https://postits-server.<account>.workers.dev
```

Set the deployed host in the client:

```ts
Postits.init({
  host: "postits-server.<account>.workers.dev",
  room: "client-specific-room-id",
});
```

Note data is stored in Cloudflare Durable Objects and stays within Cloudflare's infrastructure. For fully on-premises deployment, see [Cloudflare on-prem / Zero Trust](https://developers.cloudflare.com/cloudflare-one/).

## Persistence

`PostitsServer` persists the full Yjs document to its Durable Object's SQLite-backed storage (`this.ctx.storage`) so notes survive across sessions — including after every client disconnects and on page reload.

This uses `y-partyserver`'s `onLoad` / `onSave` hooks plus an `onClose` flush:

- `onLoad()` runs once on server start and re-hydrates `this.document` from the saved snapshot.
- `onSave()` runs debounced (~2s) after edits, writing the encoded document state back to storage.
- `onClose()` flushes a final `onSave()` when the last client disconnects. `y-partyserver` only saves via the debounced listener and does not flush on close, so without this override the final ~2s of edits would be lost when a board empties out before the Durable Object hibernates.

The `new_sqlite_classes` migration in `wrangler.jsonc` is what makes this storage durable. To persist to an external store instead (e.g. R2 or a database), override `onLoad` / `onSave` in `src/server.ts`.

## Concerns / Task 14 validation

- Protocol compatibility (two clients syncing through this server) is validated by the Playwright E2E suite in Task 14.
- The `routePartykitRequest` auto-routing maps the `Main` binding to the `/parties/main/:room` path that playhtml's embedded `YProvider` connects to. If routing fails in E2E, check that the Durable Object binding name in `wrangler.jsonc` is exactly `"Main"`.
