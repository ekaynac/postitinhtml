import { Note, MAX_TEXT_LENGTH, NOTE_SIZE } from "./types";

// Remove ASCII control characters (codes 0-31 and 127). Implemented with a
// charCode filter rather than a regex literal so the source stays plain ASCII
// (a control-char regex literal serializes to a binary file).
function stripControlChars(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code > 31 && code !== 127) out += ch;
  }
  return out;
}

export function sanitizeText(text: string, maxLen: number = MAX_TEXT_LENGTH): string {
  return stripControlChars(String(text ?? "")).trim().slice(0, maxLen);
}

export function createNote(p: {
  id: string; now: number; x: number; y: number; color: string;
  author: { name: string; id?: string }; z: number; text?: string;
}): Note {
  const note: Note = {
    id: p.id, text: sanitizeText(p.text ?? ""), x: p.x, y: p.y, color: p.color,
    authorName: p.author.name, createdAt: p.now, updatedAt: p.now, z: p.z,
  };
  if (p.author.id !== undefined) note.authorId = p.author.id;
  return note;
}

export function isNote(value: unknown): value is Note {
  if (typeof value !== "object" || value === null) return false;
  const n = value as Record<string, unknown>;
  return typeof n.id === "string" && typeof n.text === "string" &&
    typeof n.x === "number" && typeof n.y === "number" && typeof n.color === "string" &&
    typeof n.authorName === "string" && typeof n.createdAt === "number" &&
    typeof n.updatedAt === "number" && typeof n.z === "number";
}

export function clampToViewport(
  note: Note, viewport: { width: number; height: number }, size: { w: number; h: number } = NOTE_SIZE
): Note {
  const x = Math.max(0, Math.min(note.x, Math.max(0, viewport.width - size.w)));
  const y = Math.max(0, Math.min(note.y, Math.max(0, viewport.height - size.h)));
  if (x === note.x && y === note.y) return note;
  return { ...note, x, y };
}
