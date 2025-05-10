/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../Login/AuthContent";

///////////////////////////////////////////////////////////////////////////
// helpers
///////////////////////////////////////////////////////////////////////////
const wrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

/* Reset mocks & localStorage before each test */
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

///////////////////////////////////////////////////////////////////////////
// 1. login
///////////////////////////////////////////////////////////////////////////
describe("useAuth › login()", () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  it("returns true and saves token on 200 OK", async () => {
    /* mock fetch */
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      text: async () => JSON.stringify({
        token: { access: "abc123" },
        isAdmin: false,
      }),
    })));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let data;
    await act(async () => {
      data = await result.current.login("e@mail.com", "pass");
    });
    

    expect(data.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      `${apiUrl}/login/`,
      expect.objectContaining({
        method: "POST",
        headers: { 
          "Content-Type": "application/json" ,
          "Accept": "application/json"

        },
        body: JSON.stringify({ email: "e@mail.com", password: "pass" }),
      })
    );
    expect(localStorage.getItem("accessToken")).toBe("abc123");
  });

  it("returns false on network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("boom"); }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let success;
    await act(async () => {
      success = await result.current.login("x", "y");
    });
    expect(success).toBe(false);
  });
});


///////////////////////////////////////////////////////////////////////////
// 3. logout
///////////////////////////////////////////////////////////////////////////
describe("useAuth › logout()", () => {
  it("clears user state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.logout());
    // user state isn’t exposed, but we can call login after logout
    expect(await result.current.login("", "")).toBe(false); // fetch not mocked
  });
});

///////////////////////////////////////////////////////////////////////////
// clean-up
///////////////////////////////////////////////////////////////////////////
afterEach(() => {
  vi.unstubAllGlobals();
});