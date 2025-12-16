/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Settings from "../../pages/Settings.jsx";

// ---- MOCKS ----

// Mock Contexts
vi.mock("../../providers/ThemeContext", () => ({
    useTheme: () => ({
        theme: "light",
        changeTheme: vi.fn(),
        availableThemes: [
            { code: "light", icon: "🌞" },
            { code: "dark", icon: "🌙" },
        ],
        currentTheme: {
            background: "#ffffff",
            text: "#000000",
            secondary: "#00ff00",
            border: "#cccccc",
        },
    }),
}));

vi.mock("../../providers/LanguageContext", () => ({
    useLanguage: () => ({
        t: (key) => key,
        language: "en",
        changeLanguage: vi.fn(),
        availableLanguages: [
            { code: "en", name: "English" },
            { code: "tr", name: "Türkçe" },
        ],
    }),
}));

vi.mock("../../providers/AuthContext", () => ({
    useAuth: () => ({
        user: { username: "testuser" },
        logout: vi.fn(),
    }),
}));

// Mock FontSizeContext (The Feature to Test)
const mockSetFontSize = vi.fn();
vi.mock("../../providers/FontSizeContext", () => ({
    useFontSize: () => ({
        fontSize: "medium",
        setFontSize: mockSetFontSize,
    }),
}));

// Mock Navbar
vi.mock("../../components/layout/Navbar", () => ({
    default: ({ children }) => <div>{children}</div>
}));

describe("<Settings />", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders settings page with tabs", () => {
        render(
            <MemoryRouter>
                <Settings />
            </MemoryRouter>
        );

        expect(screen.getByText("settings.title")).toBeInTheDocument();
        // Check key sections/tabs
        expect(screen.getByText("settings.appearance")).toBeInTheDocument();
        expect(screen.getByText("settings.accessibility")).toBeInTheDocument();
        expect(screen.getByText("settings.about")).toBeInTheDocument();
    });

    it("changes font size when accessibility option is clicked", () => {
        render(
            <MemoryRouter>
                <Settings />
            </MemoryRouter>
        );

        // Click Accessibility Tab
        fireEvent.click(screen.getByText("settings.accessibility"));

        // Check availability of font size options
        // Assuming the component renders buttons for sizes or a select
        // Based on previous knowledge, it might be buttons or a list.
        // Let's look for "settings.fontSize" label
        expect(screen.getByText("settings.fontSize")).toBeInTheDocument();

        // Check if buttons for sizes exist. 
        // They are likely 'settings.small', 'settings.medium', etc.
        const smallBtn = screen.getByText("settings.small");
        fireEvent.click(smallBtn);

        expect(mockSetFontSize).toHaveBeenCalledWith("small");
    });
});
