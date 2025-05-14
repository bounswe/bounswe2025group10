/**
 * @vitest-environment jsdom
 */
 import React from "react";
 import "@testing-library/jest-dom";
 import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
 import { renderHook, act } from "@testing-library/react";
 import { MemoryRouter } from "react-router-dom";
 import { AuthProvider, useAuth } from "../../Login/AuthContent";
 
 /* ──────────────────────────────────────────────────────────────── */
 /* Test helpers                                                    */
 /* ──────────────────────────────────────────────────────────────── */
 
 /** Wrap hook with router + auth provider */
 const wrapper = ({ children }) => (
   <MemoryRouter>
     <AuthProvider>{children}</AuthProvider>
   </MemoryRouter>
 );
 
 /** Build a resolved Response-like object with JSON body */
 const okJson = (body) =>
   Promise.resolve({
     ok: true,
     headers: { get: () => "application/json" },
     text: async () => JSON.stringify(body),
   });
 
 /* Reset mocks & localStorage before each test */
 beforeEach(() => {
   vi.resetAllMocks();
   localStorage.clear();
 });
 
 /* Prevent real navigation during logout() */
 vi.mock("react-router-dom", async () => {
   const actual = await vi.importActual("react-router-dom");
   return { ...actual, useNavigate: () => vi.fn() };
 });
 
 /* ──────────────────────────────────────────────────────────────── */
 /* 1. login()                                                      */
 /* ──────────────────────────────────────────────────────────────── */
 describe("useAuth › login()", () => {
   const apiUrl = import.meta.env.VITE_API_URL;
 
   it("returns { success:true } and stores token on 200 OK", async () => {
     vi.stubGlobal(
       "fetch",
       vi.fn(() => okJson({ token: { access: "abc123" }, isAdmin: false }))
     );
 
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
     );
     expect(localStorage.getItem("accessToken")).toBe("abc123");
   });
 
   it("returns { success:false } on network error", async () => {
     vi.stubGlobal("fetch", vi.fn(() => { throw new Error("boom"); }));
 
     const { result } = renderHook(() => useAuth(), { wrapper });
 
     let data;
     await act(async () => {
       data = await result.current.login("x", "y");
     });
 
     expect(data.success).toBe(false);
   });
 });
 
 /* ──────────────────────────────────────────────────────────────── */
 /* 2. logout()                                                     */
 /* ──────────────────────────────────────────────────────────────── */
 describe("useAuth › logout()", () => {
   it("clears token from localStorage", () => {
     localStorage.setItem("accessToken", "dummy");
     vi.stubGlobal("fetch", vi.fn(() => okJson({})));
 
     const { result } = renderHook(() => useAuth(), { wrapper });
 
     act(() => result.current.logout());
 
     expect(localStorage.getItem("accessToken")).toBeNull();
   });
 });
 
 /* ──────────────────────────────────────────────────────────────── */
 /* Cleanup                                                         */
 /* ──────────────────────────────────────────────────────────────── */
 afterEach(() => {
   vi.unstubAllGlobals();
 });
