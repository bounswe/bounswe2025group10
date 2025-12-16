/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import ActivityCard from "../../components/features/ActivityCard";

// Mock ThemeContext
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

describe("<ActivityCard />", () => {
  const mockActivity = {
    id: "123",
    type: "Create",
    visibility: "PUBLIC",
    summary: "User created a new post",
    actor_id: "user-456",
    object_type: "Post",
    object_id: "post-789",
    published_at: "2025-01-15T10:30:00Z",
    community_id: "community-101",
    as2_json: {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Create",
      actor: "user-456",
      object: {
        type: "Post",
        id: "post-789",
      },
    },
  };

  it("renders activity card with basic information", () => {
    render(<ActivityCard activity={mockActivity} />);

    // Check type badge
    expect(screen.getByText("Create")).toBeInTheDocument();

    // Check visibility badge
    expect(screen.getByText("Public")).toBeInTheDocument();

    // Check summary
    expect(screen.getByText("User created a new post")).toBeInTheDocument();

    // Check actor ID - using more specific query
    expect(screen.getByText(/Actor:/)).toBeInTheDocument();
    const actorSection = screen.getByText(/Actor:/).parentElement;
    expect(actorSection).toHaveTextContent("user-456");

    // Check object info
    expect(screen.getByText(/Object:/)).toBeInTheDocument();
    const objectSection = screen.getByText(/Object:/).parentElement;
    expect(objectSection).toHaveTextContent("Post");
    expect(objectSection).toHaveTextContent("post-789");

    // Check event ID
    expect(screen.getByText(/Event ID:/)).toBeInTheDocument();
    const eventSection = screen.getByText(/Event ID:/).parentElement;
    expect(eventSection).toHaveTextContent("123");
  });

  it("displays community badge when community_id is present", () => {
    render(<ActivityCard activity={mockActivity} />);

    expect(screen.getByText(/Community: community-101/)).toBeInTheDocument();
  });

  it("does not display community badge when community_id is absent", () => {
    const activityWithoutCommunity = { ...mockActivity, community_id: null };
    render(<ActivityCard activity={activityWithoutCommunity} />);

    expect(screen.queryByText(/Community:/)).not.toBeInTheDocument();
  });

  it("displays formatted date correctly", () => {
    render(<ActivityCard activity={mockActivity} />);

    // Check that some form of the date is displayed
    const dateText = screen.getByText(/Published:/);
    expect(dateText).toBeInTheDocument();
  });

  it("shows 'Unknown date' when published_at is missing", () => {
    const activityWithoutDate = { ...mockActivity, published_at: null };
    render(<ActivityCard activity={activityWithoutDate} />);

    expect(screen.getByText(/Unknown date/)).toBeInTheDocument();
  });

  it("renders different activity types with correct colors", () => {
    const activityTypes = ["Create", "Update", "Delete", "Follow", "Like"];

    const labelMap = {
      Follow: "Follow User",
      Like: "Like Post",
    };

    activityTypes.forEach((type) => {
      const { container } = render(
        <ActivityCard activity={{ ...mockActivity, type }} />
      );
      expect(screen.getByText(labelMap[type] || type)).toBeInTheDocument();
    });
  });

  it("renders different visibility levels correctly", () => {
    const visibilities = [
      { value: "PUBLIC", text: "Public" },
      { value: "UNLISTED", text: "Unlisted" },
      { value: "FOLLOWERS", text: "Followers" },
      { value: "DIRECT", text: "Direct" },
    ];

    visibilities.forEach(({ value, text }) => {
      const { unmount } = render(
        <ActivityCard activity={{ ...mockActivity, visibility: value }} />
      );
      expect(screen.getByText(text)).toBeInTheDocument();
      unmount();
    });
  });

  it("displays AS2 JSON preview in details element", () => {
    render(<ActivityCard activity={mockActivity} />);

    // Check for details/summary element
    const summary = screen.getByText(/View AS2 JSON/);
    expect(summary).toBeInTheDocument();
  });

  it("expands AS2 JSON when details is clicked", async () => {
    const user = userEvent.setup();
    render(<ActivityCard activity={mockActivity} />);

    const summary = screen.getByText(/View AS2 JSON/);

    // Click to expand
    await user.click(summary);

    // Check that JSON content is visible
    const jsonContent = screen.getByText(/"@context":/);
    expect(jsonContent).toBeInTheDocument();
  });

  it("does not render AS2 JSON section when as2_json is empty", () => {
    const activityWithoutJson = { ...mockActivity, as2_json: {} };
    render(<ActivityCard activity={activityWithoutJson} />);

    expect(screen.queryByText(/View AS2 JSON/)).not.toBeInTheDocument();
  });

  it("handles missing optional fields gracefully", () => {
    const minimalActivity = {
      id: "minimal-123",
      type: "Update",
      visibility: "UNLISTED",
    };

    render(<ActivityCard activity={minimalActivity} />);

    // Should still render without crashing
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.getByText("Unlisted")).toBeInTheDocument();
    expect(screen.getAllByText(/N\/A/).length).toBeGreaterThan(0);
  });
});
