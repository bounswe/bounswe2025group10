/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublicProfile from "../../pages/profile/PublicProfile";

// ─────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────

// Mock React Router DOM
const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useParams: () => ({ username: "targetuser" }),
  useNavigate: () => navigateMock,
}));

// Mock AuthContext
const authContextValues = {
  token: "test-token",
  username: "currentuser", // current user is different from target user
  logout: vi.fn(),
};
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => authContextValues,
}));

// Mock ThemeContext
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

// ***Create a stable 't' function to prevent infinite useEffect loops ***
const tMock = (key, fallback) => fallback || key;
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: tMock, // Reference stability is crucial here
  }),
}));

// Mock Profile Service
vi.mock("../../services/profileService", () => ({
  profileService: {
    getFollowStatus: vi.fn(),
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
  },
}));

import { profileService } from "../../services/profileService";

// Mock Navbar
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div data-testid="navbar">{children}</div>,
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    main: ({ children }) => <main>{children}</main>,
    div: ({ children, onClick, className }) => (
      <div onClick={onClick} className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock Utils
vi.mock("../../utils/toast", () => ({
  showToast: vi.fn(),
}));

// ─────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────

describe("<PublicProfile />", () => {
  // Global fetch mock
  global.fetch = vi.fn();
  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => "blob:test-image-url");

  beforeEach(() => {
    vi.clearAllMocks();

    // Default Fetch Implementation
    global.fetch.mockImplementation((url) => {
      const urlStr = url ? url.toString() : "";
      
      if (urlStr.includes("/bio/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bio: "This is a test bio", user_id: 123 }),
        });
      }
      if (urlStr.includes("/picture/")) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(["fake"], { type: "image/png" })),
        });
      }
      if (urlStr.includes("/achievements/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { achievements: [] } }),
        });
      }
      if (urlStr.includes("/report/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Reported" }),
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${urlStr}`));
    });

    // Default Profile Service Mocks
    profileService.getFollowStatus.mockResolvedValue({
      data: { is_following: false, followers_count: 5, following_count: 3 },
    });
    profileService.followUser.mockResolvedValue({});
    profileService.unfollowUser.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", () => {
    render(<PublicProfile />);
    // "Loading..." is the key fallback in your code
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders profile data after loading", async () => {
    render(<PublicProfile />);

    // Wait for the bio text to appear
    await waitFor(() => {
      expect(screen.getByText("This is a test bio")).toBeInTheDocument();
    });

    expect(screen.getByText("targetuser")).toBeInTheDocument();
    // The alt text matches the fallback provided in t()
    const img = screen.getByAltText("Profile Picture");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "blob:test-image-url");
  });

  it("displays correct follower counts", async () => {
    render(<PublicProfile />);
    await waitFor(() => screen.getByText("targetuser"));

    // Check counts returned by getFollowStatus mock
    expect(screen.getByText("5")).toBeInTheDocument(); // Followers
    expect(screen.getByText("3")).toBeInTheDocument(); // Following
  });

  it("allows following a user", async () => {
    render(<PublicProfile />);
    await waitFor(() => screen.getByText("targetuser"));

    // Find the Follow button
    const followBtn = screen.getByRole("button", { name: "Follow" });
    fireEvent.click(followBtn);

    // Verify service call
    await waitFor(() => {
      expect(profileService.followUser).toHaveBeenCalledWith("targetuser", "test-token");
    });

    // Wait for UI to update: Button text changes to "Unfollow"
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Unfollow" })).toBeInTheDocument();
    });

    // Check optimistic update: Followers count increases (5 -> 6)
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("allows unfollowing a user", async () => {
    // Setup: User is already following
    profileService.getFollowStatus.mockResolvedValue({
      data: { is_following: true, followers_count: 10, following_count: 2 },
    });

    render(<PublicProfile />);
    await waitFor(() => screen.getByText("targetuser"));

    // Find Unfollow button
    const unfollowBtn = screen.getByRole("button", { name: "Unfollow" });
    fireEvent.click(unfollowBtn);

    // Verify service call
    await waitFor(() => {
      expect(profileService.unfollowUser).toHaveBeenCalledWith("targetuser", "test-token");
    });

    // Wait for UI to update: Button text changes to "Follow"
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    });

    // Check optimistic update: Followers count decreases (10 -> 9)
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("opens report modal and submits report", async () => {
    render(<PublicProfile />);
    await waitFor(() => screen.getByText("targetuser"));

    // Open Modal via Warning Icon Button
    const reportIconBtn = screen.getByTitle("Report this user");
    fireEvent.click(reportIconBtn);

    // Verify Modal Opens
    expect(screen.getByText("Report User")).toBeInTheDocument();

    // Fill Inputs
    const reasonInput = screen.getByPlaceholderText("Enter reason...");
    const descInput = screen.getByPlaceholderText("Enter description...");
    
    fireEvent.change(reasonInput, { target: { value: "Spam" } });
    fireEvent.change(descInput, { target: { value: "Bot content" } });

    // Submit Report 
    const submitBtn = screen.getByRole("button", { name: "Report" });
    fireEvent.click(submitBtn);

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/report/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ reason: "Spam", description: "Bot content" })
        })
      );
    });
  });
});