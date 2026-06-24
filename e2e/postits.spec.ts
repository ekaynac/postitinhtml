/**
 * Two-client sync + reload-persistence E2E test.
 *
 * Architecture under test:
 *   Browser A ──WS──▶ wrangler dev (localhost:8787)  ◀──WS── Browser B
 *                     /parties/main/:room
 *                     (Durable Object: PostitsServer / YServer)
 *
 * Room isolation:
 *   playhtml derives the room as:
 *     encodeURIComponent(domain + "-" + roomOption)
 *   We pass a unique `?room=e2e-<timestamp>` query param to each test run so
 *   different test runs never collide in the same Durable Object instance.
 *   Both clients in one test use the SAME room param → they sync together.
 *
 *   The static server serves the monorepo root. The vanilla example is at
 *   /examples/vanilla/. Room uniqueness comes from the ?room= param, not path.
 *
 * Host format:
 *   playhtml strips http/https/ws/wss prefixes and expects a bare host string
 *   like "localhost:8787". This is passed as ?host=localhost:8787.
 *   The WS URL it dials is: ws://localhost:8787/parties/main/:room
 *
 * Shadow DOM:
 *   The postits overlay uses an open shadow root. Playwright pierces open
 *   shadow roots automatically with CSS selectors (no special syntax needed).
 */

import { test, expect } from "@playwright/test";

const SERVER_HOST = "localhost:8787";

test("note created in client A appears in client B and persists after reload", async ({
  browser,
}) => {
  // Unique room per run prevents cross-test contamination.
  const room = `e2e-${Date.now()}`;
  // Navigate to the vanilla example page (under /examples/vanilla/) with query params.
  // The static server is rooted at the monorepo root so /packages/core/dist/ resolves.
  const url = (me: string) =>
    `/examples/vanilla/?host=${SERVER_HOST}&room=${room}&me=${me}`;

  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  // Capture console logs and WS connection info from both pages for diagnostics.
  const logsA: string[] = [];
  const logsB: string[] = [];
  pageA.on("console", (msg) => logsA.push(`[A] ${msg.type()}: ${msg.text()}`));
  pageB.on("console", (msg) => logsB.push(`[B] ${msg.type()}: ${msg.text()}`));
  pageA.on("pageerror", (err) => logsA.push(`[A] ERROR: ${err.message}`));
  pageB.on("pageerror", (err) => logsB.push(`[B] ERROR: ${err.message}`));

  // Navigate both clients to the same room.
  await pageA.goto(url("Ada"));
  await pageB.goto(url("Boran"));

  // Wait until playhtml has finished its first sync on both clients.
  // `window.playhtml.ready` is a promise that resolves on the provider's first
  // "sync" event (playhtml.es.js:11500-11502); `isLoading` flips to false when
  // it resolves (playhtml.es.js:11512). At that point the can-play element's
  // onMount has fired, so the store is mounted and addNote() will not no-op.
  const waitReady = (p: typeof pageA) =>
    p.waitForFunction(
      // @ts-expect-error window.playhtml is injected by the playhtml bundle
      () => !!window.playhtml && window.playhtml.isLoading === false,
      { timeout: 15_000 },
    );
  await waitReady(pageA);
  await waitReady(pageB);

  // ── SYNC TEST ─────────────────────────────────────────────────────────────
  // Client A adds a note.
  await pageA.getByRole("button", { name: /Note/i }).click();

  // Confirm the note actually materialized in A (proves the click hit a mounted
  // store, not a no-op) before asserting it propagates to B.
  await expect(pageA.locator(".postit")).toHaveCount(1, { timeout: 8_000 });

  // Client B should see the note appear within 5 s (CRDT sync over WS).
  // Playwright pierces open shadow roots automatically with CSS selectors.
  await expect(pageB.locator(".postit")).toHaveCount(1, { timeout: 8_000 });

  // ── PERSISTENCE TEST ──────────────────────────────────────────────────────
  // Reload client B — the Durable Object persists the Yjs doc to storage.
  await pageB.reload();
  await waitReady(pageB);
  await expect(pageB.locator(".postit")).toHaveCount(1, { timeout: 8_000 });

  // ── CLEANUP ───────────────────────────────────────────────────────────────
  // Log any errors captured during the test for CI diagnostics.
  if (logsA.some((l) => l.includes("ERROR") || l.includes("error:"))) {
    console.log("=== Page A logs ===\n" + logsA.join("\n"));
  }
  if (logsB.some((l) => l.includes("ERROR") || l.includes("error:"))) {
    console.log("=== Page B logs ===\n" + logsB.join("\n"));
  }

  await ctxA.close();
  await ctxB.close();
});
