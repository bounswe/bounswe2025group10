/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../Login/AuthContent";

/* ────────────────────────────────────────────────────────────── */
/* Helpers                                                       */
/* ────────────────────────────────────────────────────────────── */

const wrapper = ({ children }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
);

/* Clear mocks & storage between tests */
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

/* Stub react‑router’s navigate so logout() doesn’t really push */
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

/* Small helper: make a JSON fetch response */
const okJson = (bodyObj) =>
    Promise.resolve({
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify(bodyObj),
    });

/* ────────────────────────────────────────────────────────────── */
/* 1. login                                                      */
/* ────────────────────────────────────────────────────────────── */
describe("useAuth › login()", () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  it("returns { success:true } and stores token on 200 OK", async () => {
    /* stub successful POST */
    vi.stubGlobal(
        "fetch",
        vi.fn(() =>
            okJson({ token: { access: "abc123" }, isAdmin: false })
        )
    );

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
    

    expect(data).toEqual({ success: true, isAdmin: false });

    expect(fetch).toHaveBeenCalledWith(
        `${apiUrl}/login/`,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "e@mail.com", password: "pass" }),
        })

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

  it("returns { success:false } on network error", async () => {
    vi.stubGlobal(
        "fetch",
        vi.fn(() => {
          throw new Error("boom");
        })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let data;
    await act(async () => {
      data = await result.current.login("x", "y");
    });

    expect(data.success).toBe(false);
  });
});

/* ────────────────────────────────────────────────────────────── */
/* 2. logout                                                     */
/* ────────────────────────────────────────────────────────────── */
describe("useAuth › logout()", () => {
  it("clears token & user state", async () => {
    /* stub fetch so the follow‑up login doesn’t hit network */
    vi.stubGlobal(
        "fetch",
        vi.fn(() => {
          throw new Error("unauth");
        })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.logout());

    let data;
    await act(async () => {
      data = await result.current.login("x", "y");
    });

    expect(data.success).toBe(false);
    expect(localStorage.getItem("accessToken")).toBeNull();
  });
});

/* ────────────────────────────────────────────────────────────── */
/* Clean‑up                                                      */
/* ────────────────────────────────────────────────────────────── */
afterEach(() => {
  vi.unstubAllGlobals();
});
