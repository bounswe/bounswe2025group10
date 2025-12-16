/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecoveryPage from "../../pages/auth/RecoveryPage";

// 1. Import the actual modules so we can control the mocks in the tests
import { settingsService } from "../../services/settingsService";
import { showToast } from "../../utils/toast.js";

// ----------- MOCK settingsService -----------
vi.mock("../../services/settingsService", () => ({
  settingsService: {
    cancelDeletionByToken: vi.fn(),
  },
}));

// ----------- MOCK toast -----------
vi.mock("../../utils/toast.js", () => ({
  showToast: vi.fn(),
}));

// ----------- MOCK ThemeContext -----------
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#fff",
      text: "#000",
      primary: "#00f",
      secondary: "#0f0",
      border: "#ccc",
    },
  }),
}));

// ----------- MOCK LanguageContext -----------
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback || key,
    language: "en",
  }),
}));

// ----------- MOCK FontSizeContext -----------
vi.mock("../../providers/FontSizeContext", () => ({
  useFontSize: () => ({
    fontSize: 16,
  }),
}));

// ----------- MOCK react-router navigate -----------
const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// ----------- MOCK LandingNavbar -----------
vi.mock("../../components/layout/LandingNavbar", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================
//                     TESTS
// =====================================================
describe("Recovery Page", () => {
  it("renders initial UI components correctly", () => {
    render(
      <MemoryRouter>
        <RecoveryPage />
      </MemoryRouter>
    );

    // Use getByRole to distinguish between the Heading and the Button
    expect(
      screen.getByRole("heading", { name: /Recover Account/i })
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Recovery Token")).toBeInTheDocument();

    // Check for button specifically
    const submitBtn = screen.getByRole("button", { name: /Recover Account/i });
    expect(submitBtn).toBeInTheDocument();
  });

  it("when submit clicked with valid token → calls service and shows success state", async () => {
    const cancelMock = settingsService.cancelDeletionByToken;
    cancelMock.mockResolvedValue({ status: "canceled" });

    render(
      <MemoryRouter>
        <RecoveryPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Recovery Token"), {
      target: { value: "valid-token-123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Recover Account/i }));

    await waitFor(() =>
      expect(cancelMock).toHaveBeenCalledWith("valid-token-123")
    );

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "Account restored successfully!",
        "success",
        2000
      )
    );

    // Check for success message
    expect(screen.getByText("Account Reactivated!")).toBeInTheDocument();
  });

  it("when submit clicked and account is deleted → shows deleted state", async () => {
    const cancelMock = settingsService.cancelDeletionByToken;
    cancelMock.mockResolvedValue({ status: "deleted" });

    render(
      <MemoryRouter>
        <RecoveryPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Recovery Token"), {
      target: { value: "old-token-456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Recover Account/i }));

    await waitFor(() =>
      expect(screen.getByText("Account Permanently Deleted")).toBeInTheDocument()
    );
  });

  it("when service fails → shows error toast", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    const cancelMock = settingsService.cancelDeletionByToken;
    cancelMock.mockRejectedValue(new Error("Network Error"));

    render(
      <MemoryRouter>
        <RecoveryPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Recovery Token"), {
      target: { value: "bad-token" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Recover Account/i }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "Invalid token or network error.",
        "error"
      )
    );

    consoleSpy.mockRestore();
  });

  it("navigates to login when success button is clicked", async () => {
    const cancelMock = settingsService.cancelDeletionByToken;
    cancelMock.mockResolvedValue({ status: "canceled" });

    render(
      <MemoryRouter>
        <RecoveryPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Recovery Token"), {
      target: { value: "token" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Recover Account/i }));

    const loginBtn = await screen.findByText("Go to Login");
    fireEvent.click(loginBtn);

    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});