/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Leaderboard from "../../pages/Leaderboard.jsx";
import { leaderboardService } from "../../services/leaderboardService";

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

// Mock leaderboardService
vi.mock("../../services/leaderboardService", () => {
    return {
        leaderboardService: {
            getLeaderboard: vi.fn()
        }
    };
});

describe("<Leaderboard />", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders leaderboard title", async () => {
        const mockData = {
            leaderboard: [
                {
                    rank: 1,
                    username: "EcoWarrior",
                    points: 1500,
                    score: 1500,
                    profileImage: "https://example.com/pic1.jpg",
                    isCurrentUser: false
                }
            ],
            userRank: null
        };
        leaderboardService.getLeaderboard.mockResolvedValue(mockData);

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        expect(screen.getByText("leaderboard.title")).toBeInTheDocument();

        // Wait for data to load to avoid act warning
        await waitFor(() => {
            expect(screen.getAllByText("EcoWarrior").length).toBeGreaterThan(0);
        });
    });

    it("renders mock data after loading", async () => {
        const mockData = {
            leaderboard: [
                {
                    rank: 1,
                    username: "topuser",
                    points: 1500,
                    score: 1500,
                    profileImage: "https://example.com/pic1.jpg",
                    isCurrentUser: false
                }
            ],
            userRank: null
        };
        leaderboardService.getLeaderboard.mockResolvedValue(mockData);

        render(
            <MemoryRouter>
                <Leaderboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            const elements = screen.getAllByText(/topuser/i);
            expect(elements.length).toBeGreaterThan(0);
        });
    });
});
