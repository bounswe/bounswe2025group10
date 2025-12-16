/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "@/pages/profile/ProfilePage.jsx";

// ─────────────────────────────────────────────
// Mock React Router DOM
// ─────────────────────────────────────────────
const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

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
    // Mock Follow Status
    getFollowStatus: vi.fn(() => Promise.resolve({
      data: {
        followers_count: 10,
        following_count: 5
      }
    })),
    // Mock Get Followers List
    getFollowers: vi.fn(() => Promise.resolve({
      data: {
        followers: [
          { id: 1, username: 'follower_one', bio: 'Bio 1' },
          { id: 2, username: 'follower_two', bio: 'Bio 2' }
        ],
        followers_count: 2
      }
    })),
    // Mock Get Following List
    getFollowing: vi.fn(() => Promise.resolve({
      data: {
        following: [
          { id: 3, username: 'following_one', bio: 'Bio 3' }
        ],
        following_count: 1
      }
    })),
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

// Mock framer-motion (needed for AnimatePresence)
vi.mock("framer-motion", () => ({
  motion: {
    main: ({ children }) => <main>{children}</main>,
    div: ({ children, onClick, className }) => (
      <div onClick={onClick} className={className} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<ProfilePage />", () => {
  it("renders without crashing", async () => {
    const { container } = render(<ProfilePage />);
    expect(container).toBeTruthy();
    // Wait for initial data load to complete to avoid act warnings
    await screen.findByRole("heading", { level: 1, name: "testuser" });
  });

  it("loads and displays profile information", async () => {
    render(<ProfilePage />);

    // Wait for username header (indicates loading is done)
    const header = await screen.findByRole("heading", { level: 1, name: "testuser" });
    expect(header).toBeInTheDocument();
  });

  it("displays correct follower and following counts", async () => {
    render(<ProfilePage />);

    // Wait for loading to finish
    await screen.findByRole("heading", { level: 1, name: "testuser" });

    // Check for counts returned by getFollowStatus mock (10 and 5)
    // Note: We look for the text. Using regex to be flexible with layout
    expect(await screen.findByText("10")).toBeInTheDocument();
    expect(await screen.findByText("5")).toBeInTheDocument();
  });

  it("opens followers modal and lists users when clicked", async () => {
    render(<ProfilePage />);
    await screen.findByRole("heading", { level: 1, name: "testuser" });

    // Find the button containing "Followers"
    const followersBtn = screen.getByText("Followers").closest("button");
    fireEvent.click(followersBtn);

    // Wait for modal content (user from getFollowers mock)
    expect(await screen.findByText("follower_one")).toBeInTheDocument();
    expect(screen.getByText("follower_two")).toBeInTheDocument();
  });

  it("opens following modal and lists users when clicked", async () => {
    render(<ProfilePage />);
    await screen.findByRole("heading", { level: 1, name: "testuser" });

    // Find the button containing "Following"
    const followingBtn = screen.getByText("Following").closest("button");
    fireEvent.click(followingBtn);

    // Wait for modal content (user from getFollowing mock)
    expect(await screen.findByText("following_one")).toBeInTheDocument();
  });
});