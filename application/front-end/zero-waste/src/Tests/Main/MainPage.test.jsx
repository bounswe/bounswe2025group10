/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MainPage from "../../pages/MainPage";

// ---------- Mocks for providers ----------

// ThemeContext mock (Navbar + MainPage use this)
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    changeTheme: vi.fn(),
    availableThemes: [],
    currentTheme: {
      background: "#ffffff",
      text: "#000000",
      border: "#cccccc",
      primary: "#22aa22",
      primaryText: "#ffffff",
      hover: "#eeeeee",
      secondary: "#0088ff",
    },
  }),
}));

// LanguageContext mock (Navbar + MainPage use this)
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key) => key, // just return key (e.g. "mainPage.title")
    changeLanguage: vi.fn(),
    availableLanguages: [],
    language: "en",
    isRTL: false,
  }),
}));

// AuthContext mock (Navbar uses useAuth)
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// ---------- Component mocks ----------

// WeatherWidget mock
vi.mock("../../components/features/WeatherWidget", () => ({
  default: () => <div data-testid="weather-widget">weather</div>,
}));

// WasteHelperInput mock
// MainPage uses: <WasteHelperInput onSubmit={handleAddWaste} isLoading={isLoading} />
vi.mock("../../components/features/WasteHelperInput", () => ({
  default: ({ onSubmit }) => (
    <button
      type="button"
      onClick={() => onSubmit({ waste_type: "plastic", amount: 1 })}
    >
      ADD-WASTE
    </button>
  ),
}));

// ---------- Service mocks ----------

// wasteService used by MainPage:
//  - getWasteData()
//  - transformWasteDataForChart(data)
//  - addWaste(payload)
vi.mock("../../services/wasteService", () => ({
  default: {
    getWasteData: vi.fn().mockResolvedValue({ data: [] }),
    transformWasteDataForChart: vi.fn().mockReturnValue([]),
    addWaste: vi.fn().mockResolvedValue({}),
  },
}));

// tipsService used by MainPage: tipsService.getRecentTips()
vi.mock("../../services/tipsService", () => ({
  tipsService: {
    getRecentTips: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

// ---------- Recharts mock  ----------
vi.mock("recharts", () => {
  const Fake = ({ children }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Fake,
    BarChart: Fake,
    Bar: Fake,
    XAxis: Fake,
    YAxis: Fake,
    Tooltip: Fake,
    CartesianGrid: Fake,
    Legend: Fake,
    Cell: Fake,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================
//                     TESTS
// =====================================================
describe("<MainPage />", () => {
  it("renders welcome banner + weather widget", () => {
    render(
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>
    );

    // Title text from t("mainPage.title")
    expect(screen.getByText("mainPage.title")).toBeInTheDocument();
    // Weather widget mock
    expect(screen.getByTestId("weather-widget")).toBeInTheDocument();
  });

  it("renders sustainability tips heading", async () => {
    render(
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>
    );

    // We only assert the heading text here (simple, enough for HW)
    await waitFor(() => {
      expect(
        screen.getByText("mainPage.sustainabilityTips")
      ).toBeInTheDocument();
    });
  });

  it("opens points-info modal and closes it", async () => {
    render(
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>
    );

    const infoButton = screen.getByText((txt) =>
      txt.includes("mainPage.pointsInfo")
    );

    fireEvent.click(infoButton);

    // Modal heading
    expect(
      screen.getByText("mainPage.pointsPerLabel")
    ).toBeInTheDocument();

    // Click outside to close
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(
        screen.queryByText("mainPage.pointsPerLabel")
      ).not.toBeInTheDocument();
    });
  });

  it("calls addWaste via WasteHelperInput mock", async () => {
    const wasteService = (await import("../../services/wasteService")).default;

    render(
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("ADD-WASTE"));

    await waitFor(() => {
      expect(wasteService.addWaste).toHaveBeenCalledTimes(1);
      expect(wasteService.addWaste).toHaveBeenCalledWith({
        waste_type: "plastic",
        amount: 1,
      });
    });
  });
});
