/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Achievements from "../../pages/Achievements.jsx";

// ---- MOCKS ----

vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

// Mock LocalStorage
const localStorageMock = {
  getItem: vi.fn(() => "test-token"),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#fff",
      text: "#000",
      primary: "#0f0",
      secondary: "#0f0",
      border: "#ccc",
      hover: "#f0f0f0",
    },
  }),
}));

vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, defaultValue) => defaultValue || key,
    language: "en",
  }),
}));

vi.mock("../../providers/FontSizeContext", () => ({
  useFontSize: () => ({ fontSize: "medium" }),
}));

// Mock achievements data
const mockAchievementsData = [
  {
    id: 1,
    achievement: {
      title: "First Post",
      description: "Created first post",
      icon: "img.png",
    },
    earned_at: new Date().toISOString(),
  },
  {
    id: 2,
    achievement: {
      title: "Recycling Hero",
      description: "Recycled 100kg",
      icon: null,
    },
    earned_at: new Date().toISOString(),
  },
];

// Mock badges data
const mockBadgesData = {
  total_badges: 2,
  badges_by_category: {
    PLASTIC: [
      {
        id: 1,
        category: "PLASTIC",
        level: 1,
        criteria_value: 1000,
        earned_at: new Date().toISOString(),
      },
    ],
    ELECTRONIC: [
      {
        id: 2,
        category: "ELECTRONIC",
        level: 1,
        criteria_value: 500,
        earned_at: new Date().toISOString(),
      },
    ],
  },
  progress: {
    PLASTIC: {
      current_value: 1500,
      required_value: 5000,
      percentage: 30,
      next_badge: { id: 3, category: "PLASTIC", level: 2 },
      all_earned: false,
    },
  },
};

// Mock achievementsService
vi.mock("../../services/achievementsService", () => ({
  achievementsService: {
    getAchievements: vi.fn(() => Promise.resolve(mockAchievementsData)),
  },
}));

// Mock badgesService
vi.mock("../../services/badgesService", () => ({
  badgesService: {
    getUserBadgeSummary: vi.fn(() => Promise.resolve(mockBadgesData)),
  },
}));

// Mock Navbar
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

import { achievementsService } from "../../services/achievementsService";
import { badgesService } from "../../services/badgesService";

describe("<Achievements />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    achievementsService.getAchievements.mockResolvedValue(mockAchievementsData);
    badgesService.getUserBadgeSummary.mockResolvedValue(mockBadgesData);
  });

  it("renders the page title", async () => {
    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Achievements & Badges/i)).toBeInTheDocument();
    });
  });

  it("displays Challenges and Badges tabs", async () => {
    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Challenges \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Badges \(2\)/i)).toBeInTheDocument();
    });
  });

  it("displays achievements in the Challenges tab by default", async () => {
    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("First Post")).toBeInTheDocument();
      expect(screen.getByText("Recycling Hero")).toBeInTheDocument();
    });
  });

  it("switches to Badges tab when clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("First Post")).toBeInTheDocument();
    });

    // Click on Badges tab
    const badgesTab = screen.getByText(/Badges \(2\)/i);
    await user.click(badgesTab);

    // Check that badges are displayed
    await waitFor(() => {
      expect(screen.getByText("Plastic Recycler")).toBeInTheDocument();
      expect(screen.getByText("E-Waste Recycler")).toBeInTheDocument();
    });
  });

  it("displays badge progress information", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>
    );

    // Wait for data to load and click Badges tab
    await waitFor(() => {
      expect(screen.getByText(/Badges \(2\)/i)).toBeInTheDocument();
    });

    const badgesTab = screen.getByText(/Badges \(2\)/i);
    await user.click(badgesTab);

    // Check for progress information
    await waitFor(() => {
      expect(screen.getByText(/Progress to next badge/i)).toBeInTheDocument();
      expect(screen.getByText(/30\.0%/i)).toBeInTheDocument();
    });
  });

  it("shows loading state initially", async () => {
    // Make promises unresolved initially to test loading state
    achievementsService.getAchievements.mockReturnValue(new Promise(() => { }));
    badgesService.getUserBadgeSummary.mockReturnValue(new Promise(() => { }));

    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("displays earned date for achievements", async () => {
    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>
    );

    await waitFor(() => {
      const earnedTexts = screen.getAllByText(/Earned/i);
      expect(earnedTexts.length).toBeGreaterThan(0);
    });
  });
});
