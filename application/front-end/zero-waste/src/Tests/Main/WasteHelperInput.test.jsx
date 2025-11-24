import { render, screen, fireEvent } from "@testing-library/react";
import WasteHelperInput from "@/components/features/WasteHelperInput";
import { vi } from "vitest";

// Mock ThemeContext
const mockTheme = {
  background: "#ffffff",
  text: "#000000",
  primary: "#4CAF50",
  secondary: "#2196F3",
  border: "#e0e0e0",
  hover: "#f5f5f5",
};

vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({ currentTheme: mockTheme }),
}));

// Mock LanguageContext
const mockT = (key, fallback) => {
  const translations = {
    "wasteHelper.wasteType": "Waste Type",
    "wasteHelper.selectType": "Select Type",
    "wasteHelper.measurementMethod": "Measurement Method",
    "wasteHelper.selectMethod": "Select Method",
    "wasteHelper.methods.grams": "Grams",
    "wasteHelper.methods.unit": "Unit",
    "wasteHelper.itemType": "Item Type",
    "wasteHelper.chooseItem": "Choose Item",
    "wasteHelper.itemCount": "How many?",
    "wasteHelper.quantityGrams": "Quantity (grams)",
    "wasteHelper.add": "Add",
    "wasteHelper.highAmountWarning": "High amount warning",
    "wasteHelper.excessiveAmountError": "Excessive amount error - maximum 5000g allowed",
    "common.adding": "Adding...",
    "mainPage.wasteTypes.plastic": "Plastic",
    "mainPage.wasteTypes.paper": "Paper",
    "mainPage.wasteTypes.glass": "Glass",
    "mainPage.wasteTypes.metal": "Metal",
    "mainPage.wasteTypes.electronic": "Electronic",
    "mainPage.wasteTypes.oilFats": "Oil & Fats",
    "mainPage.wasteTypes.organic": "Organic",
    "wasteHelper.items.plasticBottle": "Plastic Bottle (1 pc)",
    "wasteHelper.items.plasticBag": "Plastic Bag (1 pc)",
    "wasteHelper.items.plasticCup": "Plastic Cup (1 pc)",
  };
  return translations[key] || fallback || key;
};

vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: mockT,
    isRTL: false,
  }),
}));

describe("WasteHelperInput", () => {
  it("renders waste type selector", () => {
    render(<WasteHelperInput onSubmit={vi.fn()} />);

    expect(screen.getByText("Add")).toBeInTheDocument();
    expect(screen.getByText("Waste Type")).toBeInTheDocument();
  });

  it("allows selecting waste type and grams", () => {
    const mockSubmit = vi.fn();
    render(<WasteHelperInput onSubmit={mockSubmit} />);

    // Click on "Select Type" to open waste type dropdown
    const wasteTypeDropdown = screen.getByText("Select Type");
    fireEvent.click(wasteTypeDropdown);

    // Select PLASTIC from dropdown
    fireEvent.click(screen.getByText("Plastic"));

    // Click on "Select Method" to open method dropdown
    const methodDropdown = screen.getByText("Select Method");
    fireEvent.click(methodDropdown);

    // Select Grams
    fireEvent.click(screen.getByText("Grams"));

    // Enter grams value
    const gramsInput = screen.getByPlaceholderText("e.g., 300");
    fireEvent.change(gramsInput, {
      target: { value: "200" },
    });

    fireEvent.click(screen.getByText("Add"));

    expect(mockSubmit).toHaveBeenCalledWith({
      waste_type: "PLASTIC",
      amount: 200,
    });
  });

  it("allows selecting units and converts to grams", () => {
    const mockSubmit = vi.fn();
    render(<WasteHelperInput onSubmit={mockSubmit} />);

    // Click on "Select Type" to open waste type dropdown
    fireEvent.click(screen.getByText("Select Type"));

    // Select PLASTIC from dropdown
    fireEvent.click(screen.getByText("Plastic"));

    // Click on "Select Method" to open method dropdown
    fireEvent.click(screen.getByText("Select Method"));

    // Select Unit
    fireEvent.click(screen.getByText("Unit"));

    // Click on "Choose Item" to open item dropdown
    fireEvent.click(screen.getByText("Choose Item"));

    // Select "Plastic Bottle (1 pc)" which is 25g
    fireEvent.click(screen.getByText("Plastic Bottle (1 pc) (25g)"));

    // Enter how many
    const countInput = screen.getByPlaceholderText("e.g., 2");
    fireEvent.change(countInput, {
      target: { value: "3" },
    });

    // Submit
    fireEvent.click(screen.getByText("Add"));

    expect(mockSubmit).toHaveBeenCalledWith({
      waste_type: "PLASTIC",
      amount: 25 * 3, // 75g
    });
  });

  it("disables add button and shows error when exceeding max limit (>5000g)", () => {
    const mockSubmit = vi.fn();
    render(<WasteHelperInput onSubmit={mockSubmit} />);

    // Click on "Select Type" to open waste type dropdown
    fireEvent.click(screen.getByText("Select Type"));

    // Select PLASTIC from dropdown
    fireEvent.click(screen.getByText("Plastic"));

    // Click on "Select Method" to open method dropdown
    fireEvent.click(screen.getByText("Select Method"));

    // Select Grams
    fireEvent.click(screen.getByText("Grams"));

    // Enter amount exceeding 5000g
    const gramsInput = screen.getByPlaceholderText("e.g., 300");
    fireEvent.change(gramsInput, {
      target: { value: "6000" },
    });

    // Verify excessive amount error is displayed
    expect(
      screen.getByText("Excessive amount error - maximum 5000g allowed")
    ).toBeInTheDocument();

    // Verify Add button is disabled
    const addButton = screen.getByText("Add");
    expect(addButton).toBeDisabled();

    // Try to click the button (should not call onSubmit)
    fireEvent.click(addButton);
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
