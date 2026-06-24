import { createOverlay } from "../src/overlay";
import { OVERLAY_Z_INDEX } from "../src/types";

test("creates a shadow root with notes + toolbar layers, high z-index, non-blocking", () => {
  const o = createOverlay();
  expect(o.root).toBeInstanceOf(ShadowRoot);
  expect(o.notesLayer).toBeTruthy();
  expect(o.toolbarLayer).toBeTruthy();
  const hostEl = (o.root.host as HTMLElement);
  expect(hostEl.style.zIndex).toBe(String(OVERLAY_Z_INDEX));
  expect(hostEl.style.pointerEvents).toBe("none");
  o.destroy();
  expect(document.querySelector(".postits-overlay-host")).toBeNull();
});

test("setBoardVisible toggles notes layer visibility", () => {
  const o = createOverlay();
  o.setBoardVisible(false);
  expect(o.notesLayer.style.display).toBe("none");
  o.setBoardVisible(true);
  expect(o.notesLayer.style.display).toBe("");
  o.destroy();
});
