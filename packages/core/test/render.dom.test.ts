import { renderNotes } from "../src/render";
import { Note, DEFAULT_PALETTE } from "../src/types";

const handlers = { onEdit(){}, onDelete(){}, onColor(){}, onDragStart(){}, onFocusNote(){} };
const note = (over: Partial<Note> = {}): Note => ({ id:"a", text:"hi", x:5, y:6, color:"#FEF08A", authorName:"Ada", createdAt:0, updatedAt:0, z:1, ...over });

test("renders one .postit per note positioned by x/y", () => {
  const c = document.createElement("div");
  renderNotes(c, [note(), note({ id: "b" })], { palette: DEFAULT_PALETTE, handlers, now: 0 });
  const els = c.querySelectorAll(".postit");
  expect(els).toHaveLength(2);
  expect((els[0] as HTMLElement).style.transform).toBe("translate(5px, 6px)");
});

test("note text is rendered with textContent (no HTML injection)", () => {
  const c = document.createElement("div");
  renderNotes(c, [note({ text: "<img src=x onerror=alert(1)>" })], { palette: DEFAULT_PALETTE, handlers, now: 0 });
  expect(c.querySelector("img")).toBeNull();
  expect(c.querySelector(".postit__text")!.textContent).toBe("<img src=x onerror=alert(1)>");
});

test("re-render reuses container (no duplicate nodes)", () => {
  const c = document.createElement("div");
  renderNotes(c, [note()], { palette: DEFAULT_PALETTE, handlers, now: 0 });
  renderNotes(c, [note()], { palette: DEFAULT_PALETTE, handlers, now: 0 });
  expect(c.querySelectorAll(".postit")).toHaveLength(1);
});
