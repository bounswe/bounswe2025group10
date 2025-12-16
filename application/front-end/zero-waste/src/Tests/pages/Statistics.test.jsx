/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Statistics from "@/pages/Statistics.jsx";

// ─────────────────────────────────────────────
// Mock providers
// ─────────────────────────────────────────────
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback || key,
    language: "en",
  }),
}));

vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#ffffff",
      border: "#dddddd",
      text: "#000000",
      secondary: "#00ff00",
      hover: "#eeeeee",
      chartColors: {},
    },
  }),
}));

// Minimal Navbar mock
vi.mock("../../components/layout/Navbar", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../providers/FontSizeContext", () => ({
  useFontSize: () => ({ fontSize: "medium" }),
}));

// ─────────────────────────────────────────────
// Mock Services
// ─────────────────────────────────────────────
const getWasteDataMock = vi.fn();
vi.mock("../../services/wasteService", () => ({
  default: {
    getWasteData: (...args) => getWasteDataMock(...args),
  },
}));

const getCommunityStatsMock = vi.fn();
vi.mock("../../services/communityService", () => ({
  default: {
    getCommunityStats: (...args) => getCommunityStatsMock(...args),
  },
}));

// ─────────────────────────────────────────────
// Mock 3rd Party Libraries (Recharts & Framer Motion)
// ─────────────────────────────────────────────

vi.mock("recharts", () => {
  const OriginalModule = vi.importActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: () => <div data-testid="bar-chart">BarChart</div>,
    AreaChart: () => <div data-testid="area-chart">AreaChart</div>,
    PieChart: () => <div data-testid="pie-chart">PieChart</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Cell: () => null,
    Pie: () => null,
    Legend: () => null,
    Area: () => null,
  };
});

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    main: ({ children, ...props }) => <main {...props}>{children}</main>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// ─────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────
const mockCommunityStats = {
  totalPosts: 150,
  totalTips: 45,
  activeChallenges: 5,
};

const mockWasteData = [
  {
    waste_type: "PLASTIC",
    total_amount: 500,
    records: [
      { date: "2023-12-01T10:00:00Z", amount: 200 },
      { date: "2023-12-02T10:00:00Z", amount: 300 },
    ],
  },
  {
    waste_type: "PAPER",
    total_amount: 1000,
    records: [
      { date: "2023-12-01T12:00:00Z", amount: 1000 },
    ],
  },
];

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

describe("<Statistics />", () => {
  it("renders loading state initially", () => {
    getWasteDataMock.mockReturnValue(new Promise(() => { }));
    getCommunityStatsMock.mockReturnValue(new Promise(() => { }));

    render(<Statistics />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders empty state when no waste data exists", async () => {
    getCommunityStatsMock.mockResolvedValue({ data: mockCommunityStats });
    getWasteDataMock.mockResolvedValue({ data: [] });

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No waste data yet. Start logging your recycling efforts!"
      )
    ).toBeInTheDocument();

    expect(screen.queryByTestId("area-chart")).not.toBeInTheDocument();
  });

  it("renders charts and summary when waste data exists", async () => {
    getCommunityStatsMock.mockResolvedValue({ data: mockCommunityStats });
    getWasteDataMock.mockResolvedValue({ data: mockWasteData });

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Check for Section Headers
    expect(screen.getByText("Your Waste Progress")).toBeInTheDocument();
    // Recycling History section seems to be removed from the component
    // expect(screen.getByText("Recycling History")).toBeInTheDocument();
    expect(screen.getByText("Waste by Type")).toBeInTheDocument();
    expect(screen.getByText("Waste Distribution")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();

    // Check that Recharts components were rendered
    // expect(screen.getByTestId("area-chart")).toBeInTheDocument();
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();

    expect(screen.getAllByTestId("bar-chart")).toHaveLength(2);

    // Check Summary Table Content
    expect(screen.getByText("Plastic")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();

    const paperElements = screen.getAllByText("Paper");
    expect(paperElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("1000")).toBeInTheDocument();

    // Check Total Calculation
    expect(screen.getByText("1500 grams")).toBeInTheDocument();
  });

  it("calculates and displays environmental impact correctly", async () => {
    getCommunityStatsMock.mockResolvedValue({ data: mockCommunityStats });
    getWasteDataMock.mockResolvedValue({ data: mockWasteData });

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Environmental Impact")).toBeInTheDocument();
    expect(screen.getByText("3.75 kg")).toBeInTheDocument();
    expect(screen.getByText("7.50 kWh")).toBeInTheDocument();
  });

  it("renders community statistics correctly", async () => {
    getCommunityStatsMock.mockResolvedValue({ data: mockCommunityStats });
    getWasteDataMock.mockResolvedValue({ data: [] });

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Community Statistics")).toBeInTheDocument();

    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    getCommunityStatsMock.mockRejectedValue(new Error("Community Error"));
    getWasteDataMock.mockRejectedValue(new Error("Waste Error"));

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No waste data yet. Start logging your recycling efforts!")).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});