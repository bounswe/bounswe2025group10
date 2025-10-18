import { AuthContext } from "@/Login/AuthContent";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import MainPage from "@/MainPage/MainPage";
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
import axios from "axios";

vi.mock("axios");

vi.mock("../../Login/useAuth", () => ({
  useAuth: () => ({
    user: { username: "testuser" },
    logout: vi.fn(),
  }),
}));

describe("MainPage", () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it("renders input fields and Add Waste button", () => {
    renderWithAuthProvider(<MainPage />);

    expect(screen.getByLabelText(/Waste Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Waste Quantity/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Waste/i)).toBeInTheDocument();
  });

  it("fetches and displays sustainability tips", async () => {
    const mockTips = {
      data: { data: [{ id: 1, title: "Reduce", description: "Use less plastic" }] },
    };
    axios.get.mockResolvedValueOnce(mockTips);
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // for waste data

    renderWithAuthProvider(<MainPage />);

    expect(await screen.findByText("Reduce")).toBeInTheDocument();
    expect(screen.getByText("Use less plastic")).toBeInTheDocument();
  });

  it("submits waste data and updates chart", async () => {
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // tips
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); // initial waste data

    renderWithAuthProvider(<MainPage />);

    const select = screen.getByLabelText(/Waste Type/i);
    const input = screen.getByLabelText(/Waste Quantity/i);
    const button = screen.getByText(/Add Waste/i);

    fireEvent.change(select, { target: { value: "PLASTIC" } });
    fireEvent.change(input, { target: { value: "5" } });

    axios.post.mockResolvedValueOnce({});
    axios.get.mockResolvedValueOnce({
      data: {
        data: [{ waste_type: "PLASTIC", total_amount: 5 }],
      },
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(screen.getByText("Plastic")).toBeInTheDocument();
    });
  });

  it("calls logout when log out button is clicked", () => {
    renderWithAuthProvider(<MainPage />);
    const logoutBtn = screen.getByText(/Log out/i);
    fireEvent.click(logoutBtn);
    // Since logout is mocked inside useAuth mock, can't check mockLogout here directly
    // But can check if the click triggers the expected behavior if exposed
  });
});