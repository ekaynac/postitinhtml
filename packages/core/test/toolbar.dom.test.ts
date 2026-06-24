import { renderToolbar } from "../src/toolbar";

test("clicking add fires onAdd", () => {
  const c = document.createElement("div"); let added = 0;
  renderToolbar(c, { onAdd: () => added++, onToggle: () => {} });
  (c.querySelector(".postits-tb__add") as HTMLButtonElement).click();
  expect(added).toBe(1);
});

test("toggle flips visibility and reports state", () => {
  const c = document.createElement("div"); const states: boolean[] = [];
  renderToolbar(c, { onAdd: () => {}, onToggle: (v) => states.push(v) });
  const btn = c.querySelector(".postits-tb__toggle") as HTMLButtonElement;
  btn.click(); btn.click();
  expect(states).toEqual([false, true]);
});
