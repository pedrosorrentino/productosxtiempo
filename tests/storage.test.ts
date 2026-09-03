import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadUserState, saveUserState, STORAGE_KEY } from "../src/lib/storage.ts";

describe("storage module", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage: Storage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
      get length() {
        return Object.keys(store).length;
      },
    };

    vi.stubGlobal("localStorage", mockStorage);
  });

  it("returns null when storage is empty", () => {
    expect(loadUserState()).toBeNull();
  });

  it("persists and loads valid user state", () => {
    saveUserState({
      countryCode: "ES",
      netMonthly: 2100,
      weeklyHours: 40,
      monthlySavings: 300,
      age: 28,
    });

    const loaded = loadUserState();
    expect(loaded).toEqual({
      countryCode: "ES",
      netMonthly: 2100,
      weeklyHours: 40,
      monthlySavings: 300,
      age: 28,
    });
  });

  it("sanitizes invalid values and ignores out of range age/hours", () => {
    store[STORAGE_KEY] = JSON.stringify({
      countryCode: "ES",
      netMonthly: -500, // invalid: <= 0
      weeklyHours: 120, // invalid: > 80
      monthlySavings: "invalid",
      age: 10, // invalid: < 16
    });

    const loaded = loadUserState();
    expect(loaded).toEqual({
      countryCode: "ES",
    });
  });

  it("handles corrupt JSON in localStorage gracefully without throwing", () => {
    store[STORAGE_KEY] = "corrupt{json;invalid";
    expect(loadUserState()).toBeNull();
  });
});
