import { formatRelativeTime } from "../src/time";

test("formats relative spans", () => {
  const now = 10_000_000;
  expect(formatRelativeTime(now, now)).toBe("just now");
  expect(formatRelativeTime(now - 90_000, now)).toBe("1m ago");
  expect(formatRelativeTime(now - 2 * 3600_000, now)).toBe("2h ago");
  expect(formatRelativeTime(now - 3 * 86400_000, now)).toBe("3d ago");
});
