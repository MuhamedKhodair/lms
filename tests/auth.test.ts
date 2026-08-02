import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("auth helpers", () => {
  it("hashes and compares passwords", async () => {
    const password = "my-secret-password";
    const hash = await bcrypt.hash(password, 4); // 4 = fast for tests
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare("wrong-password", hash)).toBe(false);
  });

  it("signs and verifies a JWT", () => {
    const secret = "test-secret";
    const payload = { userId: "123", email: "test@test.com", role: "STUDENT" };
    const token = jwt.sign(payload, secret);
    const decoded = jwt.verify(token, secret) as typeof payload;
    expect(decoded.userId).toBe("123");
    expect(decoded.role).toBe("STUDENT");
  });

  it("rejects an invalid token", () => {
    const token = jwt.sign({ userId: "123" }, "test-secret");
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });
});
