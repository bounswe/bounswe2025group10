/**
 * @vitest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedUserRoute from "../../Login/ProtectedUserRoute";

///////////////////////////////////////////////////////////////////////////
// mock <AuthContent />
///////////////////////////////////////////////////////////////////////////
// ❶  Import *and* mock – importing lets us access the same fn instance later
import { useAuth } from "../../Login/AuthContent";

vi.mock("../../Login/AuthContent", () => ({
  useAuth: vi.fn(),
}));

///////////////////////////////////////////////////////////////////////////
// helper
///////////////////////////////////////////////////////////////////////////
const renderWithToken = (token) => {
  // ❷  Tell the stub what to return for this render
  useAuth.mockReturnValue({
    token,
    isAuthenticated: Boolean(token),
  });

  render(
    <MemoryRouter initialEntries={["/secret"]}>
      <Routes>
        <Route element={<ProtectedUserRoute />}>
          <Route path="/secret" element={<div>SECRET PAGE</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
};

///////////////////////////////////////////////////////////////////////////
// tests
///////////////////////////////////////////////////////////////////////////
describe("<ProtectedUserRoute />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("doesn’t show protected content when invalid token", () => {
    renderWithToken(null);
    expect(screen.queryByText("SECRET PAGE")).not.toBeInTheDocument();
  });

  it("shows protected content when valid token", () => {
    renderWithToken("valid-token");
    expect(screen.getByText("SECRET PAGE")).toBeInTheDocument();
  });

  it("redirects to /login when no token", () => {
    renderWithToken(null);
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
  });
});
