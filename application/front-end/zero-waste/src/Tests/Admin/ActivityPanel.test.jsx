/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import ActivityPanel from "../../pages/admin/ActivityPanel";

/* ── mock useAuth so component mounts without real auth ───────── */
const mockLogout = vi.fn();
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({ token: "fake-token", logout: mockLogout }),
}));

/* ── mock fetch ───────────────────────────────────────────────── */
global.fetch = vi.fn();

describe("<ActivityPanel />", () => {
  const mockActivities = {
    items: [
      {
        id: "activity-1",
        type: "Create",
        visibility: "PUBLIC",
        summary: "User created a post",
        actor_id: "user-123",
        object_type: "Post",
        object_id: "post-456",
        published_at: "2025-01-15T10:30:00Z",
        as2_json: {},
      },
      {
        id: "activity-2",
        type: "Update",
        visibility: "UNLISTED",
        summary: "User updated their profile",
        actor_id: "user-789",
        object_type: "Profile",
        object_id: "profile-101",
        published_at: "2025-01-14T09:20:00Z",
        as2_json: {},
      },
    ],
    totalItems: 2,
  };

  beforeEach(() => {
    fetch.mockClear();
    mockLogout.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sidebar with navigation links", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /post moderation/i })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: /challenge moderation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /user moderation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /comment moderation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /activities/i })
    ).toBeInTheDocument();
  });

  it("renders the Activity Events header", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/📊 Activity Events/)).toBeInTheDocument();
    });
  });

  it("displays loading spinner while fetching activities", async () => {
    fetch.mockImplementationOnce(
      () =>
        new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    // Wait for the spinner to appear
    await waitFor(() => {
      expect(screen.getByText(/Activity Events/)).toBeInTheDocument();
    });

    // Check for the spinner by looking for the Bootstrap spinner class
    const spinner = document.querySelector('.spinner-border');
    expect(spinner).toBeInTheDocument();
  });

  it("fetches and displays activities on mount", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities,
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("User created a post")).toBeInTheDocument();
      expect(
        screen.getByText("User updated their profile")
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Total: 2 events/)).toBeInTheDocument();
  });

  it("displays error message when fetch fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load activity events/i)
      ).toBeInTheDocument();
    });
  });

  it("displays 'No activity events found' when activities list is empty", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No activity events found/i)).toBeInTheDocument();
    });
  });

  it("renders filter controls", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /filters/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("combobox")).toBeInTheDocument(); // Type select
    expect(screen.getByPlaceholderText(/Enter actor ID/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /clear filters/i })
    ).toBeInTheDocument();
  });

  it("applies type filter when selected", async () => {
    const user = userEvent.setup();

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const typeSelect = screen.getByRole("combobox");
    await user.selectOptions(typeSelect, "Create");

    await waitFor(() => {
      const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
      expect(lastCall[0]).toContain("type=Create");
    }, { timeout: 3000 });
  });

  it("applies actor filter when entered", async () => {
    const user = userEvent.setup();

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter actor ID/i)).toBeInTheDocument();
    });

    const actorInput = screen.getByPlaceholderText(/Enter actor ID/i);
    await user.type(actorInput, "user-123");

    await waitFor(() => {
      const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
      expect(lastCall[0]).toContain("actor_id=user-123");
    }, { timeout: 3000 });
  });

  it("clears filters when Clear Filters button is clicked", async () => {
    const user = userEvent.setup();

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const typeSelect = screen.getByRole("combobox");
    const actorInput = screen.getByPlaceholderText(/Enter actor ID/i);

    await user.selectOptions(typeSelect, "Create");
    await user.type(actorInput, "user-123");

    const clearButton = screen.getByRole("button", { name: /clear filters/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(typeSelect.value).toBe("");
      expect(actorInput.value).toBe("");
    });
  });

  it("renders pagination controls when activities are present", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities,
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("User created a post")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /previous/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByText(/Page 1/)).toBeInTheDocument();
  });

  it("disables Previous button on first page", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities,
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("User created a post")).toBeInTheDocument();
    });

    const previousButton = screen.getByRole("button", { name: /previous/i });
    expect(previousButton).toBeDisabled();
  });

  it("navigates to next page when Next button is clicked", async () => {
    const user = userEvent.setup();

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: mockActivities.items,
        totalItems: 30, // More than 15 items per page
      }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("User created a post")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2/)).toBeInTheDocument();
    });
  });

  it("calls logout when Log Out button is clicked", async () => {
    const user = userEvent.setup();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole("button", { name: /log out/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("includes authorization header in fetch request", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], totalItems: 0 }),
    });

    render(
      <MemoryRouter>
        <ActivityPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const fetchCall = fetch.mock.calls[0];
    expect(fetchCall[1].headers.Authorization).toBe("Bearer fake-token");
  });
});
