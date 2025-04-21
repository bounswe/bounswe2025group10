/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../../Login/AuthContent";
import { BrowserRouter } from "react-router-dom";

// Mock `useNavigate`
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(), // just mock useNavigate as a no-op
    BrowserRouter: actual.BrowserRouter ?? (({ children }) => <div>{children}</div>),
  };
});

// Test component that uses AuthContext
const TestComponent = () => {
  const { user, login, signup, logout } = useAuth();
  return (
    <div>
      <div data-testid="user">{user?.email || "Guest"}</div>
      <button onClick={() => login("test@mail.com", "1234")}>Login</button>
      <button onClick={() => signup("new@mail.com", "abcd")}>Signup</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithAuth = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </BrowserRouter>
  );

describe("AuthProvider simplified", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with no user", () => {
    renderWithAuth();
    expect(screen.getByTestId("user")).toHaveTextContent("Guest");
  });

  it("logs in a user", async () => {
    renderWithAuth();
    const user = userEvent.setup();
    await user.click(screen.getByText("Login"));
    expect(screen.getByTestId("user")).toHaveTextContent("test@mail.com");
  });

  it("signs up a user", async () => {
    renderWithAuth();
    const user = userEvent.setup();
    await user.click(screen.getByText("Signup"));
    expect(screen.getByTestId("user")).toHaveTextContent("new@mail.com");
  });

  it("logs out the user", async () => {
    localStorage.setItem("user", JSON.stringify({ email: "logged@mail.com" }));
    renderWithAuth();
    const user = userEvent.setup();
    await user.click(screen.getByText("Logout"));
    expect(screen.getByTestId("user")).toHaveTextContent("Guest");
  });
});