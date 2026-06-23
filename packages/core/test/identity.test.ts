import { resolveAuthor } from "../src/identity";

test("falls back to Guest when no resolver", () => {
  expect(resolveAuthor()).toEqual({ name: "Guest" });
});
test("uses resolver result when valid", () => {
  expect(resolveAuthor(() => ({ name: "Ada", id: "u1" }))).toEqual({ name: "Ada", id: "u1" });
});
test("falls back to Guest when resolver throws or returns blank", () => {
  expect(resolveAuthor(() => { throw new Error("no auth"); })).toEqual({ name: "Guest" });
  expect(resolveAuthor(() => ({ name: "   " }))).toEqual({ name: "Guest" });
});
