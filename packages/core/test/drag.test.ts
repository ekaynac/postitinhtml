import { nextPosition, createThrottle } from "../src/drag";

test("nextPosition applies the pointer delta to the origin", () => {
  expect(nextPosition({ x: 100, y: 100 }, { x: 10, y: 10 }, { x: 35, y: 5 })).toEqual({ x: 125, y: 95 });
});

test("createThrottle runs immediately then suppresses within window", () => {
  let t = 0; const calls: number[] = [];
  const fn = createThrottle((v: number) => calls.push(v), 50, () => t);
  fn(1);            // t=0 → runs
  t = 30; fn(2);    // within 50ms → suppressed
  t = 60; fn(3);    // past window → runs
  expect(calls).toEqual([1, 3]);
});
