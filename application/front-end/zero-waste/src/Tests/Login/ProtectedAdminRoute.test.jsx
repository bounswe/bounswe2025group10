/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";


vi.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div>navigate-{to}</div>,
  Outlet: () => <div>outlet</div>,
}));

vi.mock("../../providers/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
}));


import { useAuth } from "../../providers/AuthContext.jsx";
import ProtectedAdminRoute from "../../routes/ProtectedAdminRoute.jsx";

/* -------------------------------------------------------------
 * Tests
 * ----------------------------------------------------------- */
describe("ProtectedAdminRoute — minimal logic test", () => {
  it("renders nothing if not authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
    });

    const { container } = render(<ProtectedAdminRoute />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Outlet when authenticated + admin", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
    });

    render(<ProtectedAdminRoute />);
    expect(screen.getByText("outlet")).toBeInTheDocument();
  });

  it("redirects to / when authenticated but NOT admin", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
    });

    render(<ProtectedAdminRoute />);
    expect(screen.getByText("navigate-/")).toBeInTheDocument();
  });
});
