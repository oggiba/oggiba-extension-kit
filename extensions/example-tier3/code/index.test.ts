import { seed, next, nextInRange } from "./index";

describe("named random streams", () => {
  test("the same seed produces the same sequence", () => {
    seed("a", 42);
    const first = [next("a"), next("a"), next("a")];

    seed("a", 42);
    const second = [next("a"), next("a"), next("a")];

    expect(second).toEqual(first);
  });

  test("different seeds produce different sequences", () => {
    seed("a", 1);
    seed("b", 2);
    expect(next("a")).not.toBe(next("b"));
  });

  test("streams are independent of each other", () => {
    seed("x", 7);
    seed("y", 7);
    next("x"); // advance x only

    expect(next("x")).not.toBe(next("y"));
  });

  test("values stay within [0, 1)", () => {
    seed("range", 123);
    for (let i = 0; i < 1000; i++) {
      const value = next("range");
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test("nextInRange stays within [min, max)", () => {
    seed("bounded", 5);
    for (let i = 0; i < 200; i++) {
      const value = nextInRange("bounded", 10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThan(20);
    }
  });

  test("reading an unseeded stream throws", () => {
    expect(() => next("never-seeded")).toThrow(/never-seeded/);
  });
});
