/**
 * @vitest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Tips from "../../pages/Tips";

// ---------------- MOCKS ------------------

// AuthContext
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({ token: "mock-token" }),
}));

// ThemeContext
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "white",
      text: "black",
      border: "gray",
      hover: "#eee",
      secondary: "green",
    },
  }),
}));

// LanguageContext
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (_, fallback) => fallback,
    language: "en",
    isRTL: false,
    availableLanguages: [{ code: "en", name: "English", flag: "🇬🇧" }],
    changeLanguage: vi.fn(),
  }),
}));

// Navbar (prevent crashing UI)
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div data-testid="navbar">{children}</div>,
}));

// tipsService mock
vi.mock("../../services/tipsService", () => ({
  tipsService: {
    getTips: vi.fn(),
    getTipsFromUrl: vi.fn(),
    likeTip: vi.fn(),
    dislikeTip: vi.fn(),
    reportTip: vi.fn(),
    createTip: vi.fn(),
  },
}));

// useApi mock
vi.mock("../../hooks/useApi", () => ({
  useApi: (fn, opts) => ({
    data: mockData,
    loading: false,
    error: null,
    execute: vi.fn(),
    setData: vi.fn(),
  }),
}));

// ----------- Test State (updated before each test) ----------
let mockData;

beforeEach(() => {
  mockData = {
    results: [
      {
        id: 1,
        title: "Use Reusable Bags",
        description: "Bring your own bags to reduce waste.",
        like_count: 10,
        dislike_count: 1,
        is_user_liked: false,
        is_user_disliked: false,
      },
    ],
    next: null,
    previous: null,
    count: 1,
  };
});

// ----------- Render helper --------------
const renderTips = () =>
  render(
    <MemoryRouter>
      <Tips />
    </MemoryRouter>
  );

// ---------------- TESTS ------------------
describe("<Tips />", () => {
  it("renders the page title", async () => {
    renderTips();
    expect(
      screen.getByText("Sustainability Tips")
    ).toBeInTheDocument();
  });

  it("renders tips from API", async () => {
    renderTips();

    await waitFor(() => {
      expect(screen.getByText("Use Reusable Bags")).toBeInTheDocument();
      expect(
        screen.getByText("Bring your own bags to reduce waste.")
      ).toBeInTheDocument();
    });
  });

  it("renders 'Create Tip' button", () => {
    renderTips();

    expect(
      screen.getByRole("button", { name: /create tip/i })
    ).toBeInTheDocument();
  });
});
