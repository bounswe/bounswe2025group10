/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Tips from "../../pages/Tips.jsx";

// ---- MOCKS ----
vi.mock("../../providers/ThemeContext", () => ({
    useTheme: () => ({
        currentTheme: {
            background: "#fff",
            text: "#000",
            secondary: "#0f0",
            border: "#ccc",
        },
    }),
}));

vi.mock("../../providers/LanguageContext", () => ({
    useLanguage: () => ({
        t: (key) => key,
        language: "en",
    }),
}));

vi.mock("../../providers/AuthContext", () => ({
    useAuth: () => ({ token: "test-token", user: { username: "me" } }),
}));

// Mock LocalStorage
const localStorageMock = {
    getItem: vi.fn(() => "test-token"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

vi.mock("../../providers/FontSizeContext", () => ({
    useFontSize: () => ({ fontSize: "medium" }),
}));

// Mock Navbar
vi.mock("../../components/layout/Navbar", () => ({
    default: ({ children }) => <div>{children}</div>
}));

// Mock tipsService
const mockTipsData = {
    results: [
        {
            id: 1,
            title: "Save Water",
            description: "Turn off tap",
            difficulty_level: "EASY",
            like_count: 5,
            dislike_count: 0,
            is_user_liked: false,
            is_user_disliked: false
        }
    ],
    pagination: { count: 1, next: null, previous: null }
};

vi.mock("../../services/tipsService", () => ({
    tipsService: {
        getTips: vi.fn(() => Promise.resolve(mockTipsData)),
        getTipsFromUrl: vi.fn(),
        createTip: vi.fn(),
        likeTip: vi.fn(),
        dislikeTip: vi.fn(),
        reportTip: vi.fn()
    }
}));

describe("<Tips />", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders tips page title", async () => {
        render(
            <MemoryRouter>
                <Tips />
            </MemoryRouter>
        );

        expect(screen.getByText("tips.title")).toBeInTheDocument();

        // Wait for data to load to prevent act(...) warning
        await waitFor(() => {
            expect(screen.getAllByText(/Save Water/i).length).toBeGreaterThan(0);
        });
    });

    it("displays tips from service", async () => {
        render(
            <MemoryRouter>
                <Tips />
            </MemoryRouter>
        );

        await waitFor(() => {
            // Check for tip title using regex for flexibility
            const elements = screen.getAllByText(/Save Water/i);
            expect(elements.length).toBeGreaterThan(0);
        });
    });
});
