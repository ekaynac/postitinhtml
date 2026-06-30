import { Note } from "./types";
import { formatRelativeTime } from "./time";

export interface NoteHandlers {
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onColor: (id: string, color: string) => void;
  onDragStart: (id: string, e: PointerEvent) => void;
  onFocusNote: (id: string) => void;
}

export interface RenderOpts {
  palette: readonly string[];
  handlers: NoteHandlers;
  now: number;
  /** id of the signed-in user; only that user's notes are editable/deletable. */
  currentUserId?: string;
}

// You can only edit/delete/recolour your OWN note. A note with no author id is
// editable by anyone without an id (e.g. Guests on a guest board).
function isMine(n: Note, opts: RenderOpts): boolean {
  return opts.currentUserId != null ? n.authorId === opts.currentUserId : n.authorId == null;
}

/**
 * Incremental, keyed reconcile — note elements survive across renders so an
 * in-progress text edit, focus, or a button click is never destroyed by a
 * concurrent local/remote update (a remote drag no longer interrupts typing,
 * and delete/colour clicks are no longer eaten by a mid-click rebuild).
 */
export function renderNotes(container: HTMLElement, notes: Note[], opts: RenderOpts): void {
  const existing = new Map<string, HTMLElement>();
  for (const child of Array.from(container.children)) {
    const id = (child as HTMLElement).dataset.id;
    if (id) existing.set(id, child as HTMLElement);
  }

  const seen = new Set<string>();
  for (const n of [...notes].sort((a, b) => a.z - b.z)) {
    seen.add(n.id);
    const el = existing.get(n.id);
    if (el) updateNote(el, n, opts);
    else container.appendChild(buildNote(n, opts));
  }
  for (const [id, el] of existing) {
    if (!seen.has(id)) el.remove();
  }
}

function buildNote(n: Note, opts: RenderOpts): HTMLElement {
  const el = document.createElement("div");
  el.className = "postit";
  el.dataset.id = n.id;
  el.tabIndex = 0;
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); opts.handlers.onFocusNote(n.id); opts.handlers.onDragStart(n.id, e as PointerEvent); });

  const del = document.createElement("button");
  del.className = "postit__del"; del.type = "button"; del.title = "Delete note"; del.textContent = "×";
  del.addEventListener("pointerdown", (e) => e.stopPropagation());
  del.addEventListener("click", (e) => { e.stopPropagation(); opts.handlers.onDelete(n.id); });

  const text = document.createElement("textarea");
  text.className = "postit__text"; text.value = n.text; text.placeholder = "Type a note…";
  text.textContent = n.text; // XSS-safe: textarea content is never parsed as HTML
  text.addEventListener("pointerdown", (e) => e.stopPropagation());
  text.addEventListener("blur", () => opts.handlers.onEdit(n.id, text.value));

  const swatches = document.createElement("div");
  swatches.className = "postit__swatches";
  for (const c of opts.palette) {
    const b = document.createElement("button");
    b.className = "postit__swatch"; b.type = "button"; b.style.background = c; b.title = `Color ${c}`;
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    b.addEventListener("click", (e) => { e.stopPropagation(); opts.handlers.onColor(n.id, c); });
    swatches.appendChild(b);
  }

  const meta = document.createElement("div");
  meta.className = "postit__meta";

  el.append(del, text, swatches, meta);
  updateNote(el, n, opts);
  return el;
}

// Patch only what changed; never recreate the element or clobber a focused field.
function updateNote(el: HTMLElement, n: Note, opts: RenderOpts): void {
  // While actively dragging, the controller owns this element's transform for
  // smoothness — don't fight it with the throttled, synced position.
  if (el.dataset.dragging !== "1") el.style.transform = `translate(${n.x}px, ${n.y}px)`;
  el.style.background = n.color;
  el.style.zIndex = String(n.z);

  const text = el.querySelector(".postit__text") as HTMLTextAreaElement | null;
  // Don't overwrite what the user is currently typing.
  if (text && document.activeElement !== text && text.value !== n.text) text.value = n.text;

  const meta = el.querySelector(".postit__meta");
  if (meta) meta.textContent = `${n.authorName} · ${formatRelativeTime(n.updatedAt, opts.now)}`;

  // Author-scoped permissions: other people's notes are read-only.
  const mine = isMine(n, opts);
  el.classList.toggle("postit--readonly", !mine);
  if (text) text.readOnly = !mine;
  const del = el.querySelector(".postit__del") as HTMLElement | null;
  if (del) del.style.display = mine ? "" : "none";
  const swatches = el.querySelector(".postit__swatches") as HTMLElement | null;
  if (swatches) swatches.style.display = mine ? "" : "none";
}
