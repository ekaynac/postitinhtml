// @vitest-environment jsdom
import { vi } from "vitest";

const { init, destroy } = vi.hoisted(() => ({
  init: vi.fn(() => ({ addNote() {}, setBoardVisible() {}, destroy() {} })),
  destroy: vi.fn(),
}));
vi.mock("@postits/core", () => ({ Postits: { init, destroy } }));

import { render, cleanup } from "@testing-library/react";
import { PostitsProvider } from "../src/index";

afterEach(cleanup);

test("mounts core on mount and destroys on unmount", () => {
  const { unmount } = render(
    <PostitsProvider config={{ host: "h" }}>
      <div>app</div>
    </PostitsProvider>,
  );
  expect(init).toHaveBeenCalledWith({ host: "h" });
  unmount();
  expect(destroy).toHaveBeenCalled();
});
