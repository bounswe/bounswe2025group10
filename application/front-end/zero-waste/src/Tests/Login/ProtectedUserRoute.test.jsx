/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

/* -------------------------------------------------------------
 * Mock AuthContext
 * ----------------------------------------------------------- */
vi.mock("../../providers/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
}));

/* -------------------------------------------------------------
 * Mock react-router-dom (Navigate + Outlet)
 * ----------------------------------------------------------- */
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }) => <div>navigate-{to}</div>,
    Outlet: () => <div>PROTECTED-CONTENT</div>,
  };
});

/* After mocks */
import { useAuth } from "../../providers/AuthContext.jsx";
import ProtectedUserRoute from "../../routes/ProtectedUserRoute.jsx";

/* -------------------------------------------------------------
 * Helper
 * ----------------------------------------------------------- */
const renderWithAuthState = ({ isAuthenticated }) => {
  useAuth.mockReturnValue({
    isAuthenticated,
    token: isAuthenticated ? "valid" : null,
  });

  return render(
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

/* -------------------------------------------------------------
 * Tests
 * ----------------------------------------------------------- */
describe("<ProtectedUserRoute />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks protected content when not authenticated", () => {
    renderWithAuthState({ isAuthenticated: false });
    expect(screen.queryByText("PROTECTED-CONTENT")).not.toBeInTheDocument();
  });

  it("renders protected content when authenticated", () => {
    renderWithAuthState({ isAuthenticated: true });
    expect(screen.getByText("PROTECTED-CONTENT")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    renderWithAuthState({ isAuthenticated: false });
    expect(screen.getByText("navigate-/login")).toBeInTheDocument();
  });
});
