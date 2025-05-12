/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Challenges from "../../pages/Challenges";
import { AuthProvider } from "../../Login/AuthContent";
import { MemoryRouter } from "react-router-dom";

// Mock toast
vi.mock("../../util/toast.js", () => ({
  showToast: vi.fn(),
}));

// Mock Navbar
vi.mock("../../components/Navbar", () => ({
  default: () => <div data-testid="mock-navbar">Navbar</div>,
}));

// Mock SkeletonCard
vi.mock("../../components/SkeletonCard", () => ({
  default: () => <div data-testid="skeleton-card">Loading...</div>,
}));

const MOCK_CHALLENGES = [
  {
    id: 1,
    title: "Recycle Five Plastic Bottles",
    description: "Collect at least five plastic bottles and recycle them.",
    target_amount: 5,
    unit: "bottle",
    difficulty: "Easy",
    progress: 2,
  },
  {
    id: 2,
    title: "Compost Kitchen Scraps for a Week",
    description: "Compost all veggie & fruit scraps for seven days.",
    target_amount: 7,
    unit: "day",
    difficulty: "Medium",
    progress: 4,
  },
  {
    id: 3,
    title: "Car‑Free Day",
    description: "Avoid motorised vehicles for 24 hours.",
    target_amount: 1,
    unit: "day",
    difficulty: "Hard",
    progress: 0,
  },
];

const wrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

describe("<Challenges />", () => {
  beforeEach(() => {
    // ❌ NO vi.useFakeTimers()
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => MOCK_CHALLENGES,
      text: async () => JSON.stringify(MOCK_CHALLENGES),
      headers: { get: () => "application/json" },
    })));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("renders loading skeletons first", () => {
    render(<Challenges />, { wrapper });
    expect(screen.getAllByTestId("skeleton-card").length).toBeGreaterThan(0);
  });

  it("renders challenge cards after loading", async () => {
    render(<Challenges />, { wrapper });

    expect(await screen.findByText("Recycle Five Plastic Bottles")).toBeInTheDocument();
    expect(screen.getByText("Compost Kitchen Scraps for a Week")).toBeInTheDocument();
    expect(screen.getByText("Car‑Free Day")).toBeInTheDocument();
  });

  it("opens and closes the report modal", async () => {
    render(<Challenges />, { wrapper });

    await screen.findByText("Recycle Five Plastic Bottles");

    const reportButton = screen.getAllByTitle("Report this challenge")[0];
    fireEvent.click(reportButton);

    expect(screen.getByText("Report Challenge")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() =>
      expect(screen.queryByText("Report Challenge")).not.toBeInTheDocument()
    );
  });

  it("opens create challenge modal and validates empty fields", async () => {
    render(<Challenges />, { wrapper });

    // find and click the 'Create Challenge' button in the header
    const createBtn = screen.getByRole("button", { name: "Create Challenge" });
    fireEvent.click(createBtn);

    // assert modal heading is visible (not the button!)
    expect(
      screen.getByRole("heading", { name: "Create Challenge" })
    ).toBeInTheDocument();

    // now find the modal submit button (the 'Create' inside modal)
    const modalCreateBtn = screen.getByRole("button", { name: "Create" });
    fireEvent.click(modalCreateBtn);

    // still in modal since validation should fail
    expect(
      screen.getByRole("heading", { name: "Create Challenge" })
    ).toBeInTheDocument();
  });
});
