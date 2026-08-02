import { describe, it, expect } from "vitest";
import { rateLimit } from "../src/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const res = rateLimit("test:key1", { limit: 5, windowMs: 60_000 });
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(4);
  });

  it("blocks after the limit is exceeded", () => {
    for (let i = 0; i < 3; i++) {
      rateLimit("test:key2", { limit: 3, windowMs: 60_000 });
    }
    const blocked = rateLimit("test:key2", { limit: 3, windowMs: 60_000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window", async () => {
    const res1 = rateLimit("test:key3", { limit: 1, windowMs: 10 });
    expect(res1.success).toBe(true);
    const blocked = rateLimit("test:key3", { limit: 1, windowMs: 10 });
    expect(blocked.success).toBe(false);
    await new Promise((r) => setTimeout(r, 20));
    const res2 = rateLimit("test:key3", { limit: 1, windowMs: 10 });
    expect(res2.success).toBe(true);
  });
});
