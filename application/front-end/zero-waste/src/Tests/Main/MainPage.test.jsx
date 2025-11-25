import { AuthContext } from "@/Login/AuthContent";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import MainPage from "@/MainPage/MainPage";
import axios from "axios";

// --- Mock axios ---
vi.mock("axios");

// --- Mock WasteHelperInput ---
vi.mock("@/MainPage/WasteHelperInput", () => ({
  __esModule: true,
  default: ({ onSubmit }) => (
    <div data-testid="mock-helper">
      <button
        data-testid="mock-add-btn"
        onClick={() =>
          onSubmit({ waste_type: "PLASTIC", amount: 50 })
        }
      >
        Mock Add Waste
      </button>
    </div>
  ),
}));

// --- Mock useAuth ---
vi.mock("../../Login/useAuth", () => ({
  useAuth: () => ({
    user: { username: "testuser" },
    logout: vi.fn(),
  }),
}));

const mockAuthValue = {
  user: { username: "testuser" },
  logout: vi.fn(),
};

function renderWithAuthProvider(ui) {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      {ui}
    </AuthContext.Provider>
  );
}

describe("MainPage", () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it("renders the WasteHelperInput component", () => {
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // tips
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // waste

    renderWithAuthProvider(<MainPage />);

    expect(screen.getByTestId("mock-helper")).toBeInTheDocument();
  });

  it("fetches and displays sustainability tips", async () => {
    const mockTips = {
      data: {
        data: [{ id: 1, title: "Reduce", description: "Use less plastic" }],
      },
    };

    axios.get.mockResolvedValueOnce(mockTips); // tips
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // waste

    renderWithAuthProvider(<MainPage />);

    expect(await screen.findByText("Reduce")).toBeInTheDocument();
    expect(screen.getByText("Use less plastic")).toBeInTheDocument();
  });

  it("handles waste submission from WasteHelperInput and refetches data", async () => {
    // Initial fetches
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // tips
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // waste

    renderWithAuthProvider(<MainPage />);

    axios.post.mockResolvedValueOnce({}); // mock POST success

    // After adding waste, MainPage calls axios.get again for updated waste
    axios.get.mockResolvedValueOnce({
      data: {
        data: [{ waste_type: "PLASTIC", total_amount: 50 }],
      },
    });

    fireEvent.click(screen.getByTestId("mock-add-btn"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/waste/"),
        { waste_type: "PLASTIC", amount: 50 },
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Plastic")).toBeInTheDocument();
    });
  });

  it("calls logout when the Log out button is clicked", () => {
    axios.get.mockResolvedValueOnce({ data: { data: [] } });
    axios.get.mockResolvedValueOnce({ data: { data: [] } });

    renderWithAuthProvider(<MainPage />);

    fireEvent.click(screen.getByText(/Log out/i));

    expect(mockAuthValue.logout).toHaveBeenCalled();
  });
});
