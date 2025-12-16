/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ChallengePanel from "@/pages/admin/ChallengePanel";


// Mock AuthContext
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({ token: "mock-token" }),
}));

// Mock LocalStorage
const localStorageMock = {
  getItem: vi.fn(() => "mock-token"),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock diff ThemeContext
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#ffffff",
      text: "#000000",
      secondary: "#00ff00",
      border: "#cccccc",
    },
  }),
}));

// Mock LanguageContext
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback || key,
    language: "en",
  }),
}));

// Mock AdminChallengeCard
vi.mock("../../components/features/AdminChallengeCard", () => ({
  __esModule: true,
  default: ({ challengeId, name, duration, onDelete }) => (
    <div data-testid="challenge-card">
      <div>{name}</div>
      <div>{duration}</div>
      <button onClick={() => onDelete(challengeId)}>Delete</button>
    </div>
  ),
}));

// Mock adminService
vi.mock("../../services/adminService", () => ({
  default: {
    getReports: vi.fn(),
    moderateReport: vi.fn(),
  },
}));

describe("<ChallengePanel />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays ONLY challenge-type items", async () => {
    // Setup mock return
    const adminService = (await import("../../services/adminService")).default;

    adminService.getReports.mockResolvedValue({
      data: {
        results: [
          {
            id: 1,
            reason: "spam",
            description: "inappropriate content",
            content: { title: "Recycle Marathon", current_progress: "50%" },
          }
        ],
        count: 1,
        next: null,
        previous: null
      }
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ChallengePanel />
        </MemoryRouter>
      );
    });

    // Challenge rendered
    expect(await screen.findByText("Recycle Marathon")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

    // Only 1 challenge card rendered
    expect(screen.getAllByTestId("challenge-card")).toHaveLength(1);
  });

  it("calls deleteChallenge when Delete button is clicked", async () => {
    const adminService = (await import("../../services/adminService")).default;

    // Initial load
    adminService.getReports.mockResolvedValue({
      data: {
        results: [
          {
            id: 99,
            reason: "spam",
            description: "bad",
            content: {
              title: "Eco Battle",
              current_progress: "20%",
            },
          },
        ],
        count: 1,
        next: null,
        previous: null,
      }
    });

    // Mock delete success
    adminService.moderateReport.mockResolvedValue({});

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    await act(async () => {
      render(
        <MemoryRouter>
          <ChallengePanel />
        </MemoryRouter>
      );
    });

    // Challenge appears
    expect(await screen.findByText("Eco Battle")).toBeInTheDocument();

    // Click delete
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    // Check moderateReport call
    await waitFor(() => {
      expect(adminService.moderateReport).toHaveBeenCalledWith(99, "delete_media");
    });
  });
});
