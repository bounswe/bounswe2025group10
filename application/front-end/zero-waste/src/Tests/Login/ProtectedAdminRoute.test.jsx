/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen, cleanup } from "@testing-library/react";

import AuthProvider from "../../Login/AuthContent";          // ← wrap with provider
import ProtectedAdminRoute from "../../Login/ProtectedAdminRoute";

///////////////////////////////////////////////////////////////////////////
// shared helper
///////////////////////////////////////////////////////////////////////////
const renderWithAuth = (
  ui,
  { route = "/adminPage", token = null, isAdmin = false } = {}
) => {
  // reset storage for each render
  localStorage.clear();
  if (token) {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("isAdmin", String(isAdmin));       // ← flag the user as admin
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>                     {/* must be inside router */}
    </MemoryRouter>
  );
};

///////////////////////////////////////////////////////////////////////////
// tests
///////////////////////////////////////////////////////////////////////////
describe("ProtectedAdminRoute", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("redirects to /login if no token is found", () => {
    renderWithAuth(
      <Routes>
        <Route path="/adminPage" element={<ProtectedAdminRoute />}>
          <Route index element={<h1>Admin Panel</h1>} />
        </Route>
        <Route path="/login" element={<h1>Login Page</h1>} />
      </Routes>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders child route when token *and* admin flag are present", () => {
    renderWithAuth(
      <Routes>
        <Route path="/adminPage" element={<ProtectedAdminRoute />}>
          <Route index element={<h1>Admin Panel</h1>} />
        </Route>
        <Route path="/login" element={<h1>Login Page</h1>} />
      </Routes>,
      { token: "fake-admin-token", isAdmin: true }           // ← valid admin session
    );

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });
});
