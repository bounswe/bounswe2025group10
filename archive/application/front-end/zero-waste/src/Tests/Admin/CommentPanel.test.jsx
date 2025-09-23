/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

// Stub out the auth hook so CommentPanel thinks we’re logged in
vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ token: "fake-token" }),
}));

// Import *after* the mock
import CommentPanel from "../../Admin/CommentPanel";

describe("<CommentPanel />", () => {
  const renderPanel = () =>
    render(
      <MemoryRouter>
        <CommentPanel />
      </MemoryRouter>
    );

  it("renders the sidebar links", () => {
    renderPanel();

    expect(
      screen.getByRole("link", { name: /post moderation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /challenge moderation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /user moderation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /comment moderation/i })
    ).toBeInTheDocument();
  });

  it("renders all mock comments", () => {
    renderPanel();

    // Check usernames
    expect(screen.getByText("green_guru")).toBeInTheDocument();
    expect(screen.getByText("eco_ninja")).toBeInTheDocument();
    expect(screen.getByText("waste_warrior")).toBeInTheDocument();

    // Check descriptions
    expect(
      screen.getByText("Love this zero‑waste tip!")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Can you share more details on composting?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Great challenge, I'm in!")
    ).toBeInTheDocument();
  });
});