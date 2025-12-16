/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// 1. FIX: Import PreferencesPage instead of SettingsPage
import PreferencesPage from "@/pages/settings/PreferencesPage"; 

// Import actual modules so we can control them in the tests
import { useAuth } from "../../providers/AuthContext";
import { showToast } from "../../utils/toast";
import { settingsService } from "../../services/settingsService";

// ─────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────

vi.mock("../../providers/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../utils/toast", () => ({
  showToast: vi.fn(),
}));

vi.mock("../../services/settingsService", () => ({
  settingsService: {
    getPrivacySettings: vi.fn(),
    getDeletionStatus: vi.fn(),
    updatePrivacySettings: vi.fn(),
    requestDeletion: vi.fn(),
    cancelDeletion: vi.fn(),
    cancelDeletionByToken: vi.fn(),
  },
}));

vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#fff",
      border: "#ddd",
      text: "#000",
      secondary: "#0f0",
      surface: "#f9f9f9", 
    },
    theme: 'light'
  }),
}));

// Mock Language to return the fallback text (which matches your test assertions)
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    main: ({ children }) => <main>{children}</main>,
    div: ({ children, onClick, className, style }) => (
      <div onClick={onClick} className={className} style={style} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// ─────────────────────────────────────────────
// Setup & Teardown
// ─────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();

  // Setup Default Auth State
  useAuth.mockReturnValue({
    token: "test-token",
    logout: vi.fn(),
  });

  // Setup Default Service Responses
  settingsService.getPrivacySettings.mockResolvedValue({
    data: {
      bio_privacy: "public",
      waste_stats_privacy: "public",
      is_anonymous: false,
      anonymous_identifier: "anon_123",
    },
  });

  settingsService.getDeletionStatus.mockResolvedValue({
    data: { requested: false },
  });

  // Mock Clipboard API
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn(),
    },
  });
});

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────
describe("<PreferencesPage />", () => {
  it("renders without crashing and loads initial settings", async () => {
    // FIX: Render PreferencesPage
    render(<PreferencesPage />);

    // Wait for loading to finish
    const title = await screen.findByRole("heading", { level: 1, name: "Settings" });
    expect(title).toBeInTheDocument();

    // Use regex (/.../i) to match text containing Emojis
    expect(screen.getByText(/Privacy & Visibility/i)).toBeInTheDocument();
    expect(screen.getByText(/Anonymity/i)).toBeInTheDocument();
    expect(screen.getByText(/Danger Zone/i)).toBeInTheDocument();
  });

  it("updates privacy settings when dropdown changes", async () => {
    settingsService.updatePrivacySettings.mockResolvedValue({});

    // Render PreferencesPage
    render(<PreferencesPage />);
    await screen.findByRole("heading", { level: 1, name: "Settings" });

    const selects = screen.getAllByRole("combobox");
    const profileSelect = selects[0]; // Assuming first select is profile visibility

    fireEvent.change(profileSelect, { target: { value: "private" } });

    await waitFor(() => {
      expect(settingsService.updatePrivacySettings).toHaveBeenCalledWith(
        { bio_privacy: "private" },
        "test-token"
      );
    });

    expect(showToast).toHaveBeenCalledWith("Settings updated", "success");
  });

  it("toggles anonymity and shows identifier", async () => {
    settingsService.updatePrivacySettings.mockResolvedValue({});

    // Render PreferencesPage
    render(<PreferencesPage />);
    await screen.findByRole("heading", { level: 1, name: "Settings" });

    // Find the toggle button. It has no text, so we filter for buttons without text content.
    const buttons = screen.getAllByRole("button");
    const toggleBtn = buttons.find(btn => !btn.textContent);
    
    if (toggleBtn) {
        fireEvent.click(toggleBtn);

        await waitFor(() => {
            expect(settingsService.updatePrivacySettings).toHaveBeenCalledWith(
                { is_anonymous: true },
                "test-token"
            );
        });
        
        expect(await screen.findByText(/You are currently displayed as/i)).toBeInTheDocument();
        expect(screen.getByText("anon_123")).toBeInTheDocument();
    } else {
        throw new Error("Could not find anonymity toggle button");
    }
  });

  it("handles account deletion request flow", async () => {
    // 1. Setup specific mocks for this flow
    settingsService.requestDeletion.mockResolvedValue({
      data: { cancel_token: "RECOVERY-TOKEN-XYZ" },
    });
    
    const logoutSpy = vi.fn();
    useAuth.mockReturnValue({ token: "test-token", logout: logoutSpy });

    // Render PreferencesPage
    render(<PreferencesPage />);
    await screen.findByRole("heading", { level: 1, name: "Settings" });

    // 2. Click "Delete My Account"
    const deleteBtn = screen.getByText("Delete My Account");
    fireEvent.click(deleteBtn);

    // 3. Verify Confirmation Modal appears
    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

    // 4. Click "Yes, Delete Account"
    const confirmBtn = screen.getByText("Yes, Delete Account");
    fireEvent.click(confirmBtn);

    // 5. Verify API call
    await waitFor(() => {
      expect(settingsService.requestDeletion).toHaveBeenCalledWith("test-token");
    });

    // 6. Verify Recovery Token Modal appears
    expect(await screen.findByText("Deletion Requested")).toBeInTheDocument();
    expect(screen.getByText("RECOVERY-TOKEN-XYZ")).toBeInTheDocument();

    // 7. Test Copy Token
    const copyBtn = screen.getByTitle("Copy");
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("RECOVERY-TOKEN-XYZ");

    // 8. Test Logout Button
    const logoutBtn = screen.getByText("I have saved it, Log me out");
    fireEvent.click(logoutBtn);
    expect(logoutSpy).toHaveBeenCalled();
  });

  it("displays scheduled deletion state and handles cancellation", async () => {
    // Override default mock: Account is ALREADY scheduled for deletion
    settingsService.getDeletionStatus.mockResolvedValue({
      data: {
        requested: true,
        delete_after: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      },
    });

    settingsService.cancelDeletion.mockResolvedValue({});

    // FIX: Render PreferencesPage
    render(<PreferencesPage />);
    
    // Wait for load
    await screen.findByRole("heading", { level: 1, name: "Settings" });

    // 1. Check for "Deletion Scheduled" UI instead of "Delete My Account" button
    expect(screen.getByText("Deletion Scheduled")).toBeInTheDocument();
    expect(screen.queryByText("Delete My Account")).not.toBeInTheDocument();

    // 2. Click "Cancel Deletion"
    const cancelBtn = screen.getByText("Cancel Deletion");
    fireEvent.click(cancelBtn);

    // 3. Verify API call and Success Toast
    await waitFor(() => {
      expect(settingsService.cancelDeletion).toHaveBeenCalledWith("test-token");
    });
    expect(showToast).toHaveBeenCalledWith("Deletion cancelled", "success");
  });
});