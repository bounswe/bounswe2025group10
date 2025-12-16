/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

/* ---------- mock AuthContext ---------- */
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    token: "fake-token",
    apiUrl: "http://mock-api.com",
    logout: vi.fn(),
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

/* ---------- mock fetch ---------- */
const mockUsers = {
  results: [
    { username: "green_guru", id: 1 },
    { username: "eco_ninja", id: 2 },
    { username: "waste_warrior", id: 3 },
  ],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockUsers),
  }));
});

/* ---------- component under test ---------- */
import UserPanel from "@/pages/admin/UserPanel";

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

/* ---------- helper ---------- */
const renderUserPanel = () =>
  render(
    <MemoryRouter>
      <UserPanel />
    </MemoryRouter>
  );

/* ---------- TESTS ---------- */
describe("<UserPanel />", () => {


  it("renders the UserPanel heading", async () => {
    renderUserPanel();

    expect(screen.getByText("User Moderation")).toBeInTheDocument();
  });
});
