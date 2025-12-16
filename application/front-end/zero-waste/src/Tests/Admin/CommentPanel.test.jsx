/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/providers/AuthContext", () => ({
  useAuth: () => ({
    token: "fake-token",
    isAdmin: true,
  }),
}));

vi.mock("@/components/features/AdminCommentCard", () => ({
  __esModule: true,
  default: ({ username, description }) => (
    <div data-testid="comment-card">
      <div>{username}</div>
      <div>{description}</div>
    </div>
  ),
}));

import CommentPanel from "@/pages/admin/CommentPanel";

describe("<CommentPanel />", () => {
  it("renders the sidebar links", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          results: [],
        }),
    });

    render(
      <MemoryRouter>
        <CommentPanel />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /post moderation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /challenge moderation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /user moderation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /comment moderation/i })).toBeInTheDocument();
  });

});
