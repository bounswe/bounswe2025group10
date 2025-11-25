/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfilePage from "@/pages/profile/ProfilePage.jsx";

// ─────────────────────────────────────────────
// Mock AuthContext
// ─────────────────────────────────────────────
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    token: "test-token",
    username: "testuser",
    logout: vi.fn(),
  }),
}));

// ─────────────────────────────────────────────
// Mock ThemeContext
// ─────────────────────────────────────────────
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#fff",
      border: "#ddd",
      text: "#000",
      secondary: "#0f0",
    },
  }),
}));

// ─────────────────────────────────────────────
// Mock LanguageContext
// ─────────────────────────────────────────────
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// ─────────────────────────────────────────────
// Prevent actual API calls
// ─────────────────────────────────────────────
vi.mock("../../services/profileService", () => ({
  profileService: {
    getProfile: vi.fn(() =>
      Promise.resolve({ bio: "hello world" })
    ),
    updateProfile: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock("../../services/postsService", () => ({
  postsService: {
    getUserPosts: vi.fn(() => Promise.resolve([])),
  },
}));

// Mock Navbar to avoid layout complexity
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

// Mock framer-motion (optional for stability)
vi.mock("framer-motion", () => ({
  motion: {
    main: ({ children }) => <main>{children}</main>,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<ProfilePage />", () => {
  it("renders without crashing", async () => {
    const { container } = render(<ProfilePage />);
    expect(container).toBeTruthy();
  });

  it("contains a header and at least one button", async () => {
    render(<ProfilePage />);

    // Because loadProfile() sets loading=true first, we wait for username header
    const header = await screen.findByRole("heading", { level: 1 });
    expect(header).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
