import { DEFAULT_PALETTE, DEFAULT_COLOR, MAX_TEXT_LENGTH, NOTE_SIZE, BOARD_ID } from "../src/types";

test("constants have expected values", () => {
  expect(DEFAULT_PALETTE).toEqual(["#FEF08A","#FBCFE8","#BFDBFE","#BBF7D0","#FED7AA"]);
  expect(DEFAULT_PALETTE).toContain(DEFAULT_COLOR);
  expect(MAX_TEXT_LENGTH).toBe(500);
  expect(NOTE_SIZE).toEqual({ w: 220, h: 200 });
  expect(BOARD_ID).toBe("postits-board");
});
