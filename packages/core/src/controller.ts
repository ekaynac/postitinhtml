import { BoardData, PostitsConfig, DEFAULT_PALETTE, DEFAULT_COLOR, BOARD_ID, NOTE_SIZE } from "./types";
import { createOverlay } from "./overlay";
import { renderToolbar } from "./toolbar";
import { renderNotes, NoteHandlers } from "./render";
import { createStore, Store, StoreHandle } from "./store";
import { resolveAuthor } from "./identity";
import { nextPosition, createThrottle } from "./drag";
import { clampToViewport } from "./note";

export interface PostitsInstance { addNote(): void; setBoardVisible(v: boolean): void; destroy(): void }

export function createController(playhtml: { init: (o?: { host?: string }) => void }, config: PostitsConfig = {}): PostitsInstance {
  const palette = config.palette ?? [...DEFAULT_PALETTE];
  const boardId = config.boardId ?? BOARD_ID;
  const now = () => Date.now();
  const uuid = () => crypto.randomUUID();

  const overlay = createOverlay();
  let store: Store | null = null;

  // Hidden playhtml registry element (light DOM) — single source of truth.
  const reg = document.createElement("div");
  reg.id = boardId; reg.setAttribute("can-play", ""); reg.style.display = "none";
  (reg as any).defaultData = { notes: [] } as BoardData;

  const render = () => {
    if (!store) return;
    const vp = { width: window.innerWidth, height: window.innerHeight };
    const notes = store.getNotes().map((n) => clampToViewport(n, vp, NOTE_SIZE));
    renderNotes(overlay.notesLayer, notes, { palette, handlers, now: now() });
  };

  const handlers: NoteHandlers = {
    onEdit: (id, text) => store?.editNote(id, text),
    onDelete: (id) => { const removed = store?.deleteNote(id); if (removed) showUndo(() => store?.restoreNote(removed)); },
    onColor: (id, color) => store?.setColor(id, color),
    onFocusNote: (id) => store?.bringToFront(id),
    onDragStart: (id, e) => beginDrag(id, e),
  };

  function beginDrag(id: string, e: PointerEvent) {
    const start = store?.getNotes().find((n) => n.id === id); if (!start) return;
    const origin = { x: start.x, y: start.y };
    const pStart = { x: e.clientX, y: e.clientY };
    const commit = createThrottle((x: number, y: number) => store?.moveNote(id, x, y), 50, now);
    const move = (ev: PointerEvent) => { const p = nextPosition(origin, pStart, { x: ev.clientX, y: ev.clientY }); commit(p.x, p.y); };
    const up = (ev: PointerEvent) => {
      const p = nextPosition(origin, pStart, { x: ev.clientX, y: ev.clientY });
      store?.moveNote(id, p.x, p.y);
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  function showUndo(restore: () => void) {
    const bar = document.createElement("div"); bar.className = "postits-undo"; bar.textContent = "Note deleted ";
    Object.assign(bar.style, { position: "absolute", left: "16px", bottom: "16px", background: "#111827", color: "#fff", padding: "8px 12px", borderRadius: "8px", pointerEvents: "auto" } as CSSStyleDeclaration);
    const btn = document.createElement("button"); btn.textContent = "Undo"; btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => { restore(); bar.remove(); });
    bar.appendChild(btn); overlay.toolbarLayer.appendChild(bar);
    setTimeout(() => bar.remove(), 5000);
  }

  const toolbar = renderToolbar(overlay.toolbarLayer, {
    onAdd: () => addNote(),
    onToggle: (v) => overlay.setBoardVisible(v),
  });

  function addNote() {
    if (!store) return;
    const author = resolveAuthor(config.identity);
    store.addNote({ x: window.innerWidth / 2 - NOTE_SIZE.w / 2, y: window.innerHeight / 2 - NOTE_SIZE.h / 2, color: DEFAULT_COLOR, author });
  }

  (reg as any).updateElement = (_: { element: HTMLElement; data: BoardData }) => render();
  (reg as any).onMount = (h: { getData: () => BoardData; setData: (m: (d: BoardData) => void) => void }) => {
    const handle: StoreHandle = { getData: h.getData, setData: h.setData };
    store = createStore(handle, { now, uuid });
    render();
  };

  document.body.appendChild(reg);
  window.addEventListener("resize", render);
  playhtml.init(config.host ? { host: config.host } : undefined);

  return {
    addNote,
    setBoardVisible: (v) => { overlay.setBoardVisible(v); toolbar.setVisible(v); },
    destroy() { window.removeEventListener("resize", render); reg.remove(); overlay.destroy(); store = null; },
  };
}
