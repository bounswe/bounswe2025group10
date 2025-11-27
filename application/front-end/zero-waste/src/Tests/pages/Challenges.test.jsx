/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---- MOCKS ----

// mock Navbar (we don't care about its UI)
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div data-testid="navbar">{children}</div>,
}));

// mock AuthContext
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

// mock ThemeContext
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      text: "black",
      border: "gray",
      background: "white",
      secondary: "green",
      primary: "blue",
    },
  }),
}));

// mock LanguageContext
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (k, d) => d ?? k,
    isRTL: false,
  }),
}));

vi.mock("../../hooks/useApi", () => ({
  useApi: () => ({
    data: { results: [] }, // prevents undefined destructure
    loading: true,         // forces loading section to render
    error: null,
    execute: vi.fn(),
    setData: vi.fn(),
  }),
}));

import Challenges from "../../pages/Challenges.jsx";

// ---- TESTS ----

describe("<Challenges /> – minimal working test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading text without crashing", () => {
    render(<Challenges />);

    const loadingText = screen.getByText(/loading challenges/i);
    expect(loadingText).toBeInTheDocument();
  });
});
