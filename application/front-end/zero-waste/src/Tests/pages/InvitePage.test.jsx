/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Invite from "@/pages/Invite.jsx";

// ─────────────────────────────────────────────
// Mock providers
// ─────────────────────────────────────────────
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback || key,
    isRTL: false,
  }),
}));

vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#ffffff",
      border: "#dddddd",
      text: "#000000",
      secondary: "#00ff00",
    },
  }),
}));

// Minimal Navbar mock
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

// Mock toast
const showToastMock = vi.fn();
vi.mock("../../utils/toast", () => ({
  showToast: (...args) => showToastMock(...args),
}));

// Mock invite service
const sendInviteMock = vi.fn();
vi.mock("../../services/inviteService", () => ({
  inviteService: {
    sendInvite: (...args) => sendInviteMock(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<Invite />", () => {
  it("renders correctly", () => {
    render(<Invite />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("shows an error when email is empty", () => {
    render(<Invite />);

    fireEvent.click(screen.getByRole("button"));

    expect(showToastMock).toHaveBeenCalledWith(
      "invite.errors.noEmail",
      "error"
    );
  });

  it("sends invite successfully", async () => {
    sendInviteMock.mockResolvedValue({
      message: "Invite sent!",
    });

    render(<Invite />);

    fireEvent.change(screen.getByPlaceholderText("friend@example.com"), {
      target: { value: "friend@mail.com" },
    });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(sendInviteMock).toHaveBeenCalledWith(
        "friend@mail.com",
        "test-token"
      );
      expect(showToastMock).toHaveBeenCalledWith("Invite sent!", "success");
    });
  });

  it("shows error toast on failure", async () => {
    sendInviteMock.mockRejectedValue({
      response: { data: { error: "Already invited!" } },
    });

    render(<Invite />);

    fireEvent.change(screen.getByPlaceholderText("friend@example.com"), {
      target: { value: "friend@mail.com" },
    });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("Already invited!", "error");
    });
  });

  it("shows fallback error when no server message exists", async () => {
    sendInviteMock.mockRejectedValue({});

    render(<Invite />);

    fireEvent.change(screen.getByPlaceholderText("friend@example.com"), {
      target: { value: "friend@mail.com" },
    });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        "invite.errors.failed",
        "error"
      );
    });
  });

  it("disables the button while loading", async () => {
    // mock infinite pending promise to simulate loading
    sendInviteMock.mockImplementation(
      () => new Promise(() => {})
    );

    render(<Invite />);

    fireEvent.change(screen.getByPlaceholderText("friend@example.com"), {
      target: { value: "friend@mail.com" },
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});
