/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import Activities from "../../pages/Activities.jsx";

// ---- MOCKS ----

// Mock AuthContext
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    username: "testuser",
    token: "test-token",
  }),
}));

// Mock ThemeContext
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      backgroundColor: "#ffffff",
      textColor: "#000000",
      cardBackground: "#f5f5f5",
      borderColor: "#cccccc",
      inputBackground: "#ffffff",
      buttonBackground: "#007bff",
      mutedText: "#6c757d",
    },
  }),
}));

// Mock LanguageContext
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, defaultValue) => defaultValue || key,
    language: "en",
  }),
}));

// Mock UserActivityCard component
vi.mock("../../components/features/ActivityCard", () => ({
  default: ({ activity }) => (
    <div data-testid="activity-card">Activity ID: {activity.id}</div>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

describe("Activities Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the component with header", () => {
    // Mock empty response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    expect(screen.getByText(/Activity Feed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your activities and activities from people you follow/i)
    ).toBeInTheDocument();
  });

  it("should show loading state while fetching activities", () => {
    // Mock pending promise
    global.fetch.mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading activities/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should display activities when data is fetched successfully", async () => {
    const mockActivities = {
      items: [
        {
          id: 1,
          object_type: "Note",
          as2_json: { type: "Create" },
        },
        {
          id: 2,
          object_type: "UserWaste",
          as2_json: { type: "Create" },
        },
      ],
      totalItems: 2,
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities,
    });

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("activity-card")).toHaveLength(2);
    });
  });

  it("should display error message when fetch fails", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load activity events/i)
      ).toBeInTheDocument();
    });
  });

  it("should display 'No activities found' when there are no activities", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No activities found/i)).toBeInTheDocument();
    });
  });

  it("should filter activities by type", async () => {
    const mockActivities = {
      items: [
        {
          id: 1,
          object_type: "Note",
          as2_json: { type: "Create" },
        },
        {
          id: 2,
          object_type: "UserWaste",
          as2_json: { type: "Create" },
        },
      ],
      totalItems: 2,
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockActivities,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("activity-card")).toHaveLength(2);
    });

    // Find and change the filter select
    const filterSelect = screen.getByRole("combobox", {
      name: /Activity Type/i,
    });
    await user.selectOptions(filterSelect, "create-waste");

    await waitFor(() => {
      // Should only show UserWaste activity
      expect(screen.getAllByTestId("activity-card")).toHaveLength(1);
    });
  });

  it("should clear filters when Clear Filters button is clicked", async () => {
    const mockActivities = {
      items: [
        {
          id: 1,
          object_type: "Note",
          as2_json: { type: "Create" },
        },
      ],
      totalItems: 1,
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockActivities,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("activity-card")).toBeInTheDocument();
    });

    // Select a filter
    const filterSelect = screen.getByRole("combobox", {
      name: /Activity Type/i,
    });
    await user.selectOptions(filterSelect, "create-post");

    // Click Clear Filters
    const clearButton = screen.getByRole("button", { name: /Clear Filters/i });
    await user.click(clearButton);

    // Filter should be reset to "All Types"
    expect(filterSelect.value).toBe("");
  });

  it("should render pagination controls when there are multiple pages", async () => {
    // Create 20 activities to ensure pagination appears (15 per page)
    const mockActivities = {
      items: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        object_type: "Note",
        as2_json: { type: "Create" },
      })),
      totalItems: 20,
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities,
    });

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Previous/i })
      ).toBeInTheDocument();
    });
  });

  it("should navigate to next page when Next button is clicked", async () => {
    const mockActivities = {
      items: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        object_type: "Note",
        as2_json: { type: "Create" },
      })),
      totalItems: 20,
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 2/i)).toBeInTheDocument();
    });
  });

  it("should call API with correct authorization header", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <Activities />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/following-activity-events/"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });
  });
});
