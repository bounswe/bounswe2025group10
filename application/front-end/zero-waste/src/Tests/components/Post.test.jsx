/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Post from "../../components/features/Post";

// ---- MOCK AUTH ----
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    token: "test-token",
    apiUrl: "http://mock-api.com",
  }),
}));

// ---- MOCK LANGUAGE ----
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (_, fallback) => fallback,
  }),
}));

// ---- MOCK THEME ----
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      text: "black",
      background: "white",
      border: "gray",
      secondary: "green",
      hover: "#eee",
    },
  }),
}));

describe("<Post />", () => {
  const mockPost = {
    id: 1,
    title: "Mock Post Title",
    description: "This is a mock post description.",
    image: null,
    like_count: 5,
    liked: false,
  };

  it("renders title, description, and like count", () => {
    render(<Post post={mockPost} />);

    expect(screen.getByText("Mock Post Title")).toBeInTheDocument();
    expect(
      screen.getByText("This is a mock post description.")
    ).toBeInTheDocument();

    expect(screen.getByText("5")).toBeInTheDocument();

    // Like button exists
    expect(
      screen.getByRole("button", { name: /like/i })
    ).toBeInTheDocument();
  });
});
