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

// Mock useAdminReports
const mockUseAdminReports = {
  items: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  nextPage: null,
  previousPage: null,
  handleNextPage: vi.fn(),
  handlePreviousPage: vi.fn(),
  deleteItem: vi.fn(),
};

vi.mock("../../hooks/useAdminReports", () => ({
  useAdminReports: vi.fn(() => mockUseAdminReports),
}));

describe("<ChallengePanel />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays ONLY challenge-type items", async () => {
    // Setup mock return
    const { useAdminReports } = await import("../../hooks/useAdminReports");
    useAdminReports.mockReturnValue({
      ...mockUseAdminReports,
      items: [
        {
          id: 1,
          content_type: "challenge",
          content: { title: "Recycle Marathon", current_progress: "50%" },
        }
      ]
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
    const { useAdminReports } = await import("../../hooks/useAdminReports");
    const mockDelete = vi.fn().mockResolvedValue(true);

    useAdminReports.mockReturnValue({
      ...mockUseAdminReports,
      items: [
        {
          id: 99,
          content_type: "challenge",
          content: {
            title: "Eco Battle",
            current_progress: "20%",
          },
        },
      ],
      deleteItem: mockDelete
    });

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

    // Check deleteItem call
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(99, "delete_media");
    });
  });
});
