/**
 * @vitest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

import LeaderboardPage from "../../pages/Leaderboard";
import { leaderboardService } from "../../services/leaderboardService";
import { useAuth } from "../../providers/AuthContext";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import Navbar from "../../components/layout/Navbar";

///////////////////////////////////////////////////////////////////////////
// MOCKS
///////////////////////////////////////////////////////////////////////////
vi.mock("../../providers/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../providers/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: vi.fn(),
}));

vi.mock("../../components/layout/Navbar", () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="navbar">NAVBAR {children}</div>
  ),
}));

vi.mock("../../services/leaderboardService", () => ({
  leaderboardService: {
    getLeaderboard: vi.fn(),
  },
}));

///////////////////////////////////////////////////////////////////////////
//  MOCK DEFAULT PROVIDERS
///////////////////////////////////////////////////////////////////////////
function setupProviders() {
  useAuth.mockReturnValue({
    token: "test-token",
    logout: vi.fn(),
  });

  useTheme.mockReturnValue({
    currentTheme: {
      background: "white",
      border: "gray",
      text: "black",
      hover: "#eee",
      secondary: "#00aa00",
    },
  });

  useLanguage.mockReturnValue({
    t: (_, fallback) => fallback, // always return fallback text
  });
}

///////////////////////////////////////////////////////////////////////////
//  SAMPLE MOCK RETURN DATA
///////////////////////////////////////////////////////////////////////////
const mockLeaderboard = {
  leaderboard: [
    {
      username: "user1",
      score: 100,
      points: 150,
      rank: 1,
      profileImage: "",
      isCurrentUser: false,
    },
    {
      username: "user2",
      score: 95,
      points: 120,
      rank: 2,
      profileImage: "",
      isCurrentUser: false,
    },
    {
      username: "user3",
      score: 90,
      points: 100,
      rank: 3,
      profileImage: "",
      isCurrentUser: false,
    },
  ],
  userRank: null,
};

///////////////////////////////////////////////////////////////////////////
// RENDER HELPER
///////////////////////////////////////////////////////////////////////////
const renderLB = () => {
  setupProviders();
  leaderboardService.getLeaderboard.mockResolvedValue(mockLeaderboard);

  return render(
    <MemoryRouter>
      <LeaderboardPage />
    </MemoryRouter>
  );
};

///////////////////////////////////////////////////////////////////////////
// TESTS
///////////////////////////////////////////////////////////////////////////
describe("<LeaderboardPage />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls leaderboardService with token", async () => {
    await act(async () => renderLB());

    await waitFor(() => {
      expect(leaderboardService.getLeaderboard).toHaveBeenCalledWith(
        "test-token"
      );
    });
  });


});
