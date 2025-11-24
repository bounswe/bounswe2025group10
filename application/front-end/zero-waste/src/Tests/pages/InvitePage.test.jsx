/**
 * @vitest-environment jsdom
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InviteFriend from "../../pages/InviteFriend.jsx";
import { AuthProvider } from "../../Login/AuthContent";

// ────────────────────────────────────────────
// Mock toast
// ────────────────────────────────────────────
vi.mock("../../utils/toast.js", () => ({
  showToast: vi.fn(),
}));

// ────────────────────────────────────────────
// Mock Navbar
// ────────────────────────────────────────────
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => (
    <div data-testid="mock-navbar">
      Navbar
      <div>{children}</div>
    </div>
  ),
}));

// ────────────────────────────────────────────
// Mock inviteService
// ────────────────────────────────────────────
const sendInviteMock = vi.fn();
vi.mock("../../services/inviteService.js", () => ({
  inviteService: {
    sendInvite: (...args) => sendInviteMock(...args),
  },
}));

// Wrapper with MemoryRouter + AuthProvider
const wrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

describe("<InviteFriend />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page with email input and a button", () => {
    render(<InviteFriend />, { wrapper });

    expect(screen.getByTestId("mock-navbar")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows error toast when trying to send without email", () => {
    const { showToast } = require("../../utils/toast.js");

    render(<InviteFriend />, { wrapper });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("sends invite when email is entered", async () => {
    const { showToast } = require("../../utils/toast.js");
    sendInviteMock.mockResolvedValueOnce({ message: "ok" });

    render(<InviteFriend />, { wrapper });

    const input = screen.getByRole("textbox");
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "friend@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(sendInviteMock).toHaveBeenCalledTimes(1);
    });

    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("shows error toast when service fails", async () => {
    const { showToast } = require("../../utils/toast.js");
    sendInviteMock.mockRejectedValueOnce(new Error("fail"));

    render(<InviteFriend />, { wrapper });

    const input = screen.getByRole("textbox");
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "friend@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalled();
    });
  });
});
