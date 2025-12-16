/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Achievements from "../../pages/Achievements.jsx";

// ---- MOCKS ----

vi.mock("../../providers/AuthContext", () => ({
    useAuth: () => ({ token: "test-token" }),
}));

// Mock LocalStorage
const localStorageMock = {
    getItem: vi.fn(() => "test-token"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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

vi.mock("../../providers/FontSizeContext", () => ({
    useFontSize: () => ({ fontSize: "medium" }),
}));

// Mock achievementsService
vi.mock("../../services/achievementsService", () => ({
    achievementsService: {
        getAchievements: vi.fn(() => Promise.resolve({
            id: 1,
            achievement: { title: "First Post", description: "First post desc", icon: "img.png" },
            earned_at: new Date().toISOString()
        }))
        // The component expects an array, but wait. Check usage.
        // In Achievements.jsx:
        // const { data: achievements } = useApi(() => ...getAchievements(token), { initialData: [] })
        // If usage is: achievements.map(...)
        // The service usually returns the data.
        // Let's verify service return structure.
        // achievementsService.js likely returns response.data or similar.
        // Assuming it returns an array of objects.
    }
}));

// Mock Navbar
vi.mock("../../components/layout/Navbar", () => ({
    default: ({ children }) => <div>{children}</div>
}));

// We need to return an array for getAchievements based on component mapping:
// { id, achievement, earned_at }
const mockAchievementsData = [
    {
        id: 1,
        achievement: { title: "First Post", description: "Created first post", icon: "img.png" },
        earned_at: new Date().toISOString()
    }
];

// Update the mock implementation
import { achievementsService } from "../../services/achievementsService";
achievementsService.getAchievements.mockResolvedValue(mockAchievementsData);

describe("<Achievements />", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        achievementsService.getAchievements.mockResolvedValue(mockAchievementsData);
    });

    it("renders the Achievements page title", async () => {
        render(
            <MemoryRouter>
                <Achievements />
            </MemoryRouter>
        );

        expect(screen.getByText("achievements.title")).toBeInTheDocument();

        // Wait for data to load to prevent act(...) warning
        await waitFor(() => {
            expect(screen.getAllByText(/First Post/i).length).toBeGreaterThan(0);
        });
    });

    it("displays achievements after loading", async () => {
        render(
            <MemoryRouter>
                <Achievements />
            </MemoryRouter>
        );

        await waitFor(() => {
            // Check for the achievement title
            const elements = screen.getAllByText(/First Post/i);
            expect(elements.length).toBeGreaterThan(0);
        });
    });
});
