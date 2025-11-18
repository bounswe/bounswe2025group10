import { render, screen, fireEvent } from "@testing-library/react";
import WasteHelperInput from "@/MainPage/WasteHelperInput";
import { vi } from "vitest";

describe("WasteHelperInput", () => {
  it("renders waste type selector", () => {
    render(<WasteHelperInput onSubmit={vi.fn()} />);

    expect(screen.getByText("Add Waste")).toBeInTheDocument();
    expect(screen.getByLabelText("Waste Type")).toBeInTheDocument();
  });

  it("allows selecting waste type and grams", () => {
    const mockSubmit = vi.fn();
    render(<WasteHelperInput onSubmit={mockSubmit} />);

    // Select waste type
    fireEvent.change(screen.getByLabelText(/Waste Type/i), {
      target: { value: "PLASTIC" },
    });

    // Select grams method
    fireEvent.change(screen.getByLabelText(/Measurement Method/i), {
      target: { value: "grams" },
    });

    fireEvent.change(screen.getByPlaceholderText("e.g., 500"), {
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

    // Select waste type
    fireEvent.change(screen.getByLabelText("Waste Type"), {
      target: { value: "PLASTIC" },
    });

    // Method: unit
    fireEvent.change(screen.getByLabelText("Measurement Method"), {
      target: { value: "unit" },
    });

    // Select "Plastic Bottle (1 pc)" which is 25g
    fireEvent.change(screen.getByLabelText("Item Type"), {
      target: { value: "Plastic Bottle (1 pc)" },
    });

    // How many?
    fireEvent.change(screen.getByLabelText("How many?"), {
      target: { value: "3" },
    });

    // Submit
    fireEvent.click(screen.getByText("Add"));

    expect(mockSubmit).toHaveBeenCalledWith({
      waste_type: "PLASTIC",
      amount: 25 * 3, // 75g
    });
  });
});
