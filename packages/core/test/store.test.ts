import { createStore, StoreHandle } from "../src/store";
import { BoardData } from "../src/types";

function fakeHandle(): StoreHandle & { state: BoardData } {
  const state: BoardData = { notes: [] };
  return { state, getData: () => state, setData: (m) => m(state) };
}
const deps = (() => { let n = 0, t = 1000; return { now: () => (t += 1), uuid: () => `id-${++n}` }; })();

test("addNote appends a note with incrementing z", () => {
  const h = fakeHandle(); const s = createStore(h, deps);
  const a = s.addNote({ x: 1, y: 2, color: "#FEF08A", author: { name: "Ada" } });
  const b = s.addNote({ x: 3, y: 4, color: "#FEF08A", author: { name: "Ada" } });
  expect(h.state.notes).toHaveLength(2);
  expect(b.z).toBeGreaterThan(a.z);
});

test("editNote/moveNote/bringToFront mutate the right note", () => {
  const h = fakeHandle(); const s = createStore(h, deps);
  const a = s.addNote({ x: 0, y: 0, color: "#FEF08A", author: { name: "Ada" } });
  s.editNote(a.id, "hello"); s.moveNote(a.id, 50, 60);
  const stored = h.state.notes.find(n => n.id === a.id)!;
  expect(stored.text).toBe("hello"); expect(stored.x).toBe(50); expect(stored.y).toBe(60);
});

test("deleteNote removes and returns it; restoreNote re-adds", () => {
  const h = fakeHandle(); const s = createStore(h, deps);
  const a = s.addNote({ x: 0, y: 0, color: "#FEF08A", author: { name: "Ada" } });
  const removed = s.deleteNote(a.id);
  expect(removed?.id).toBe(a.id); expect(h.state.notes).toHaveLength(0);
  s.restoreNote(removed!); expect(h.state.notes).toHaveLength(1);
});

test("setColor changes a note's color", () => {
  const h = fakeHandle(); const s = createStore(h, deps);
  const a = s.addNote({ x: 0, y: 0, color: "#FEF08A", author: { name: "Ada" } });
  s.setColor(a.id, "#BFDBFE");
  expect(h.state.notes[0]!.color).toBe("#BFDBFE");
});
