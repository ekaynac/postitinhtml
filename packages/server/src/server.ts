/**
 * @postits/server — Yjs sync server for postits.
 *
 * DISCOVERY FINDINGS (Task 12):
 * - playhtml bundles y-partyserver's YProvider client directly inside its
 *   own dist bundle. It connects to `/parties/main/<room>` over WebSocket,
 *   using the standard Yjs sync protocol from y-protocols.
 * - playhtml does NOT publish a separate self-hostable PartyKit server module.
 *   The npm package only ships a browser-side bundle.
 * - The correct server counterpart is `YServer` from `y-partyserver` (a
 *   Cloudflare Durable Object class). playhtml's dependency list confirms
 *   this: `y-partyserver` is a direct dependency of `playhtml`.
 * - The old `partykit` CLI is NOT used here. The current ecosystem uses
 *   `partyserver` + `wrangler` (Cloudflare Workers) instead.
 *
 * PERSISTENCE (y-partyserver onLoad/onSave API):
 * - onLoad(): Promise<Doc | void> runs once on server start; if it returns a
 *   Doc its state is applied onto this.document.
 *   (node_modules/y-partyserver/dist/server/index.js:97, :143-148)
 * - onSave(): Promise<void> is wired to a DEBOUNCED document-update listener
 *   (default 2s debounce / 10s maxWait).
 *   (node_modules/y-partyserver/dist/server/index.js:98, :183-202)
 * - We persist the full Yjs document as a single binary update in the
 *   Durable Object's own SQLite-backed storage (this.ctx.storage). The
 *   `new_sqlite_classes` migration in wrangler.jsonc makes DO storage durable
 *   across all-clients-disconnected, so a reload re-hydrates existing notes.
 *
 * TRAILING-EDIT FLUSH (closes 2nd-review finding):
 * - y-partyserver's save is ONLY the debounced update listener; its `onClose`
 *   (node_modules/y-partyserver/dist/server/index.js:325-333) cleans up
 *   awareness and does NOT flush onSave. The debounced fn is anonymous (not
 *   stored), so there is no library handle to .flush(). When the LAST client
 *   disconnects, a pending debounced save (last ~2s of edits) would be lost
 *   before the Durable Object hibernates.
 * - We close this by overriding onClose: after delegating to super.onClose for
 *   awareness cleanup, if no OPEN connections remain we await onSave() to
 *   eagerly persist the final state. partyserver's getConnections() yields
 *   only readyState===OPEN sockets and the closing socket is already non-OPEN
 *   inside onClose (node_modules/partyserver/dist/index.js:185-191, :642-653),
 *   so an empty result here means this was the last client.
 *
 * COMPATIBILITY NOTE (for Task 14 E2E validation):
 * - playhtml's YProvider connects to `/parties/${party || "main"}/<room>`.
 * - `routePartykitRequest` from `partyserver` handles this routing when the
 *   Durable Object binding is named "Main" (auto-converts to kebab "main").
 * - Two-client sync through this server remains to be validated by Task 14.
 */

import { routePartykitRequest, type Connection } from "partyserver";
import { YServer } from "y-partyserver";
import * as Y from "yjs";

// Env binding matching wrangler.jsonc's durable_objects binding "Main".
interface Env {
  Main: DurableObjectNamespace;
}

// Single storage key holding the encoded Yjs document state for this room.
const DOC_STORAGE_KEY = "postits:doc";

// PostitsServer handles Yjs CRDT sync for one postits room (Durable Object
// instance) and persists the document to durable DO storage so notes survive
// across sessions (all clients disconnecting / page reloads).
export class PostitsServer extends YServer<Env> {
  // onLoad runs once on server start. Re-hydrate this.document from the
  // persisted snapshot if one exists.
  async onLoad(): Promise<void> {
    const saved = await this.ctx.storage.get<Uint8Array>(DOC_STORAGE_KEY);
    if (saved) {
      Y.applyUpdate(this.document, saved);
    }
  }

  // onSave runs debounced after edits. Persist the full document state.
  async onSave(): Promise<void> {
    const update = Y.encodeStateAsUpdate(this.document);
    await this.ctx.storage.put(DOC_STORAGE_KEY, update);
  }

  // Flush trailing edits when the last client leaves: the library only saves
  // via a debounced listener and never flushes on close, so without this the
  // final ~2s of edits would be lost before the DO hibernates.
  async onClose(
    connection: Connection,
    code: number,
    reason: string,
    wasClean: boolean,
  ): Promise<void> {
    await super.onClose(connection, code, reason, wasClean);
    const stillConnected = [...this.getConnections()].length > 0;
    if (!stillConnected) {
      await this.onSave();
    }
  }
}

// Default fetch handler: route PartyKit-style /parties/main/:room requests.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ??
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
