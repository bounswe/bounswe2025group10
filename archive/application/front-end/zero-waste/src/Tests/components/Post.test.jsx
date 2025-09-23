import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Post from "../../components/Post";

// ───── Minimal mock for AuthContext ─────
vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({
    token: "test-token",
    apiUrl: "http://mock-api.com",
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

  it("renders the post title, description, and like count", () => {
    render(<Post post={mockPost} />);

    expect(screen.getByText(/Mock Post Title/i)).toBeInTheDocument();
    expect(screen.getByText(/This is a mock post description/i)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /like/i })).toBeInTheDocument();
  });
});