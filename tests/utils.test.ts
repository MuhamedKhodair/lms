import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, courseSchema, parsePagination } from "../src/lib/utils";

describe("parsePagination", () => {
  it("parses valid page and limit", () => {
    const sp = new URLSearchParams("page=2&limit=30");
    expect(parsePagination(sp)).toEqual({ page: 2, limit: 30, skip: 30 });
  });

  it("defaults to page 1 and 20 when params are missing", () => {
    expect(parsePagination(new URLSearchParams())).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("clamps invalid values", () => {
    expect(parsePagination(new URLSearchParams("page=-5&limit=abc")).page).toBe(1);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "pw" }).success).toBe(true);
  });

  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("courseSchema", () => {
  it("accepts a valid course", () => {
    const result = courseSchema.safeParse({
      title: "Intro to TypeScript",
      description: "Learn TypeScript from scratch.",
    });
    expect(result.success).toBe(true);
    expect(result.data?.price).toBe(0);
  });

  it("rejects missing title", () => {
    expect(
      courseSchema.safeParse({ description: "Learn TypeScript from scratch." }).success
    ).toBe(false);
  });
});
