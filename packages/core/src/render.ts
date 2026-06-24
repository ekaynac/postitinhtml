import { Note, DEFAULT_PALETTE } from "./types";
import { formatRelativeTime } from "./time";

export interface NoteHandlers {
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onColor: (id: string, color: string) => void;
  onDragStart: (id: string, e: PointerEvent) => void;
  onFocusNote: (id: string) => void;
}

export function renderNotes(
  container: HTMLElement, notes: Note[],
  opts: { palette: readonly string[]; handlers: NoteHandlers; now: number }
): void {
  container.replaceChildren();
  for (const n of [...notes].sort((a, b) => a.z - b.z)) {
    container.appendChild(buildNote(n, opts));
  }
}

function buildNote(n: Note, opts: { palette: readonly string[]; handlers: NoteHandlers; now: number }): HTMLElement {
  const el = document.createElement("div");
  el.className = "postit";
  el.dataset.id = n.id;
  el.style.transform = `translate(${n.x}px, ${n.y}px)`;
  el.style.background = n.color;
  el.style.zIndex = String(n.z);
  el.tabIndex = 0;
  el.addEventListener("pointerdown", (e) => { opts.handlers.onFocusNote(n.id); opts.handlers.onDragStart(n.id, e); });

  const del = document.createElement("button");
  del.className = "postit__del"; del.type = "button"; del.title = "Delete note"; del.textContent = "×";
  del.addEventListener("click", (e) => { e.stopPropagation(); opts.handlers.onDelete(n.id); });

  const text = document.createElement("textarea");
  text.className = "postit__text"; text.value = n.text; text.placeholder = "Type a note…";
  text.textContent = n.text; // ensure textContent path is exercised / no HTML parsing
  text.addEventListener("pointerdown", (e) => e.stopPropagation());
  text.addEventListener("blur", () => opts.handlers.onEdit(n.id, text.value));

  const swatches = document.createElement("div");
  swatches.className = "postit__swatches";
  for (const c of opts.palette) {
    const b = document.createElement("button");
    b.className = "postit__swatch"; b.type = "button"; b.style.background = c; b.title = `Color ${c}`;
    b.addEventListener("click", (e) => { e.stopPropagation(); opts.handlers.onColor(n.id, c); });
    swatches.appendChild(b);
  }

  const meta = document.createElement("div");
  meta.className = "postit__meta";
  meta.textContent = `${n.authorName} · ${formatRelativeTime(n.updatedAt, opts.now)}`;

  el.append(del, text, swatches, meta);
  return el;
}
