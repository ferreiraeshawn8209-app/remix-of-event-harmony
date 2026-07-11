import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useVoicePreferences } from "@/hooks/useVoicePreferences";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("useVoicePreferences", () => {
  it("persists voice toggle by user scope", () => {
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });

    const { result, unmount } = renderHook(() => useVoicePreferences("user-a"));
    expect(result.current.preferences.enabled).toBe(true);

    act(() => {
      result.current.setEnabled(false);
    });
    expect(result.current.preferences.enabled).toBe(false);
    unmount();

    const { result: sameUser } = renderHook(() => useVoicePreferences("user-a"));
    expect(sameUser.current.preferences.enabled).toBe(false);

    const { result: otherUser } = renderHook(() => useVoicePreferences("user-b"));
    expect(otherUser.current.preferences.enabled).toBe(true);
  });
});
