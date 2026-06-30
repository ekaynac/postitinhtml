import { Note, BoardData } from "./types";
import { createNote, sanitizeText, isNote } from "./note";

export interface StoreHandle { setData: (m: (draft: BoardData) => void) => void; getData: () => BoardData }
export interface StoreDeps { now: () => number; uuid: () => string }
export interface Store {
  getNotes(): Note[];
  addNote(i: { x: number; y: number; color: string; author: { name: string; id?: string }; text?: string }): Note;
  editNote(id: string, text: string): void;
  moveNote(id: string, x: number, y: number): void;
  bringToFront(id: string): void;
  deleteNote(id: string): Note | undefined;
  restoreNote(n: Note): void;
  setColor(id: string, color: string): void;
}

export function maxZ(notes: Note[]): number {
  return notes.reduce((m, n) => Math.max(m, n.z), 0);
}

export function createStore(handle: StoreHandle, deps: StoreDeps): Store {
  const notes = () => (handle.getData().notes ?? []).filter(isNote);
  return {
    getNotes: notes,
    addNote(i) {
      const note = createNote({ id: deps.uuid(), now: deps.now(), x: i.x, y: i.y, color: i.color, author: i.author, z: maxZ(notes()) + 1, text: i.text });
      handle.setData((d) => { d.notes.push(note); });
      return note;
    },
    editNote(id, text) {
      const clean = sanitizeText(text); const now = deps.now();
      // No-op blurs (e.g. clicking delete/colour) must not bump updatedAt.
      handle.setData((d) => { const n = d.notes.find((x) => x.id === id); if (n && n.text !== clean) { n.text = clean; n.updatedAt = now; } });
    },
    moveNote(id, x, y) {
      // Repositioning is not a content edit — don't touch updatedAt so the
      // "x ago" time keeps reflecting creation/last-edit, not dragging.
      handle.setData((d) => { const n = d.notes.find((x2) => x2.id === id); if (n) { n.x = x; n.y = y; } });
    },
    bringToFront(id) {
      const top = maxZ(notes()) + 1;
      handle.setData((d) => { const n = d.notes.find((x) => x.id === id); if (n) n.z = top; });
    },
    deleteNote(id) {
      const found = notes().find((n) => n.id === id);
      if (found) handle.setData((d) => { const i = d.notes.findIndex((x) => x.id === id); if (i >= 0) d.notes.splice(i, 1); });
      return found;
    },
    restoreNote(n) { handle.setData((d) => { if (!d.notes.some((x) => x.id === n.id)) d.notes.push(n); }); },
    setColor(id, color) {
      const now = deps.now();
      handle.setData((d) => { const n = d.notes.find((x) => x.id === id); if (n) { n.color = color; n.updatedAt = now; } });
    },
  };
}
