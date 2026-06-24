import { vi } from "vitest";

const initSpy = vi.fn();
vi.mock("playhtml", () => ({ playhtml: { init: (...a: unknown[]) => initSpy(...a) } }));

import { Postits } from "../src/index";

afterEach(() => Postits.destroy());

test("init creates a hidden can-play registry element and calls playhtml.init with host", () => {
  Postits.init({ host: "example.partykit.dev" });
  const reg = document.getElementById("postits-board")!;
  expect(reg).toBeTruthy();
  expect(reg.hasAttribute("can-play")).toBe(true);
  expect((reg as any).defaultData).toEqual({ notes: [] });
  expect(typeof (reg as any).updateElement).toBe("function");
  expect(typeof (reg as any).onMount).toBe("function");
  expect(initSpy).toHaveBeenCalledWith({ host: "example.partykit.dev" });
});

test("updateElement renders notes into the overlay", () => {
  Postits.init();
  const reg = document.getElementById("postits-board")! as any;
  // simulate playhtml onMount handing us setData/getData
  let state = { notes: [] as any[] };
  reg.onMount({ getData: () => state, setData: (m: any) => m(state), getElement: () => reg });
  state.notes.push({ id:"a", text:"hi", x:1, y:2, color:"#FEF08A", authorName:"Ada", createdAt:0, updatedAt:0, z:1 });
  reg.updateElement({ element: reg, data: state });
  const host = document.querySelector(".postits-overlay-host") as HTMLElement;
  expect(host.shadowRoot!.querySelectorAll(".postit")).toHaveLength(1);
});
