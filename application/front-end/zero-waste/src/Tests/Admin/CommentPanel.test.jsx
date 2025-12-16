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

// Mock LocalStorage
const localStorageMock = {
  getItem: vi.fn(() => "fake-token"),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock LanguageContext
vi.mock("@/providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback || key,
    language: "en",
  }),
}));

// Mock ThemeContext
vi.mock("@/providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#ffffff",
      text: "#000000",
      secondary: "#00ff00",
      border: "#cccccc",
    },
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
  it("renders the CommentPanel heading", () => {
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

    expect(screen.getByText("Comment Moderation")).toBeInTheDocument();
  });

});
