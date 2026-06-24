export function nextPosition(
  origin: { x: number; y: number }, pointerStart: { x: number; y: number }, pointerNow: { x: number; y: number }
): { x: number; y: number } {
  return { x: origin.x + (pointerNow.x - pointerStart.x), y: origin.y + (pointerNow.y - pointerStart.y) };
}

export function createThrottle<T extends (...a: any[]) => void>(fn: T, ms: number, now: () => number) {
  let last = -Infinity;
  return (...args: Parameters<T>) => {
    const t = now();
    if (t - last >= ms) { last = t; fn(...args); }
  };
}
