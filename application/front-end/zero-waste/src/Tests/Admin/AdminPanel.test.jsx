/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import AdminPanel from "@/pages/admin/AdminPanel";

// Mock AuthContext
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



describe("<AdminPanel />", () => {
  it("renders the post titles", () => {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>
    );

    //will do later when posts are present.
  });
});