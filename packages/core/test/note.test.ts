import { sanitizeText, createNote, isNote, clampToViewport } from "../src/note";
import { MAX_TEXT_LENGTH } from "../src/types";

test("sanitizeText trims and clamps length", () => {
  expect(sanitizeText("  hi  ")).toBe("hi");
  expect(sanitizeText("x".repeat(600)).length).toBe(MAX_TEXT_LENGTH);
});

test("sanitizeText strips ASCII control characters", () => {
  const dirty = "a" + String.fromCharCode(0) + "b" + String.fromCharCode(31) + "c" + String.fromCharCode(127) + "d";
  expect(sanitizeText(dirty)).toBe("abcd");
});

test("createNote builds an immutable note with defaults", () => {
  const n = createNote({ id: "a", now: 1000, x: 10, y: 20, color: "#FEF08A", author: { name: "Ada", id: "u1" }, z: 3 });
  expect(n).toEqual({ id:"a", text:"", x:10, y:20, color:"#FEF08A", authorName:"Ada", authorId:"u1", createdAt:1000, updatedAt:1000, z:3 });
});

test("isNote rejects malformed inbound data", () => {
  expect(isNote({ id:"a", text:"", x:0, y:0, color:"#fff", authorName:"A", createdAt:1, updatedAt:1, z:0 })).toBe(true);
  expect(isNote({ id:"a" })).toBe(false);
  expect(isNote(null)).toBe(false);
});

test("clampToViewport keeps a note fully inside the viewport", () => {
  const n = createNote({ id:"a", now:0, x:5000, y:-50, color:"#fff", author:{name:"A"}, z:0 });
  const c = clampToViewport(n, { width: 1000, height: 800 });
  expect(c.x).toBe(1000 - 220);
  expect(c.y).toBe(0);
  expect(n.x).toBe(5000); // original unchanged (immutable)
});
