/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "../../pages/LandingPage.jsx";

// ---- MOCKS ----
vi.mock("../../providers/ThemeContext", () => ({
    useTheme: () => ({
        currentTheme: {
            background: "#fff",
            text: "#000",
            secondary: "#0f0",
        },
    }),
}));

vi.mock("../../providers/LanguageContext", () => ({
    useLanguage: () => ({
        t: (key) => key,
    }),
}));

vi.mock("../../providers/FontSizeContext", () => ({
    useFontSize: () => ({ fontSize: "medium" }),
}));

// Mock Navbar (LandingNavbar)
vi.mock("../../components/layout/LandingNavbar", () => ({
    default: ({ children }) => <div data-testid="landing-navbar">{children}</div>
}));

describe("<LandingPage />", () => {
    it("renders landing page elements", () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );

        expect(screen.getByText("landing.title")).toBeInTheDocument();
        expect(screen.getByText("landing.subtitle")).toBeInTheDocument();
        expect(screen.getByTestId("landing-navbar")).toBeInTheDocument();
    });
});
