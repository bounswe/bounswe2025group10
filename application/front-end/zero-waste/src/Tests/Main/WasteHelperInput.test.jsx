/**
 * @vitest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import WasteHelperInput from "@/components/features/WasteHelperInput";

// ------------------ MOCK CONTEXTS ------------------
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#ffffff",
      text: "#000000",
      border: "#dddddd",
      secondary: "#4caf50",
      hover: "#f0f0f0",
    },
  }),
}));

vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key) => key, // RETURN THE KEY AS TEXT
  }),
}));

// ------------------ HELPER ------------------
const renderComponent = (props = {}) => {
  return render(<WasteHelperInput onSubmit={vi.fn()} isLoading={false} {...props} />);
};

// =============================================================
//                      TESTS
// =============================================================

describe("<WasteHelperInput />", () => {
  // -----------------------------------------------------------
  it("renders initial disabled inputs correctly", () => {
    renderComponent();

    expect(screen.getByText("wasteHelper.selectType")).toBeInTheDocument();
    expect(screen.getByText("wasteHelper.selectMethod")).toBeInTheDocument();
    expect(screen.getByText("wasteHelper.chooseItem")).toBeInTheDocument();

    expect(screen.getByText("wasteHelper.add")).toBeDisabled();
  });

  // -----------------------------------------------------------
  it("enables Add button only when inputs are valid", () => {
    const onSubmit = vi.fn();
    renderComponent({ onSubmit });

    // Select WASTE TYPE
    fireEvent.click(screen.getByText("wasteHelper.selectType"));
    fireEvent.click(screen.getByText("mainPage.wasteTypes.plastic"));

    // Select METHOD
    fireEvent.click(screen.getByText("wasteHelper.selectMethod"));
    fireEvent.click(screen.getByText("wasteHelper.methods.grams"));

    // Quantitiy
    const gramsInput = screen.getByPlaceholderText("e.g., 300");
    fireEvent.change(gramsInput, { target: { value: "200" } });

    // Button should now be enabled
    expect(screen.getByText("wasteHelper.add")).toBeEnabled();
  });

  // -----------------------------------------------------------
  it("calls onSubmit with correct grams when using GRAMS method", () => {
    const onSubmit = vi.fn();
    renderComponent({ onSubmit });

    // Select WASTE TYPE
    fireEvent.click(screen.getByText("wasteHelper.selectType"));
    fireEvent.click(screen.getByText("mainPage.wasteTypes.glass"));

    // Select "grams"
    fireEvent.click(screen.getByText("wasteHelper.selectMethod"));
    fireEvent.click(screen.getByText("wasteHelper.methods.grams"));

    // Enter grams
    fireEvent.change(screen.getByPlaceholderText("e.g., 300"), {
      target: { value: "300" },
    });

    fireEvent.click(screen.getByText("wasteHelper.add"));

    expect(onSubmit).toHaveBeenCalledWith({
      waste_type: "GLASS",
      amount: 300,
    });
  });

  // -----------------------------------------------------------
  it("calls onSubmit with correct grams when using UNIT method", () => {
    const onSubmit = vi.fn();
    renderComponent({ onSubmit });

    // Waste type: PLASTIC
    fireEvent.click(screen.getByText("wasteHelper.selectType"));
    fireEvent.click(screen.getByText("mainPage.wasteTypes.plastic"));

    // Method: unit
    fireEvent.click(screen.getByText("wasteHelper.selectMethod"));
    fireEvent.click(screen.getByText("wasteHelper.methods.unit"));

    // Select unit option (plasticBottle → 25g)
    fireEvent.click(screen.getByText("wasteHelper.chooseItem"));
    fireEvent.click(screen.getByText("wasteHelper.items.plasticBottle (25g)"));

    // Enter quantity
    fireEvent.change(screen.getByPlaceholderText("e.g., 2"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByText("wasteHelper.add"));

    // 3 × 25g = 75g
    expect(onSubmit).toHaveBeenCalledWith({
      waste_type: "PLASTIC",
      amount: 75,
    });
  });

  // -----------------------------------------------------------
  it("shows a warning when grams exceed 500g", () => {
    renderComponent();

    // Select type
    fireEvent.click(screen.getByText("wasteHelper.selectType"));
    fireEvent.click(screen.getByText("mainPage.wasteTypes.paper"));

    // Select grams method
    fireEvent.click(screen.getByText("wasteHelper.selectMethod"));
    fireEvent.click(screen.getByText("wasteHelper.methods.grams"));

    fireEvent.change(screen.getByPlaceholderText("e.g., 300"), {
      target: { value: "600" },
    });

    expect(screen.getByText("wasteHelper.highAmountWarning")).toBeInTheDocument();
  });

  // -----------------------------------------------------------
  it("shows an ERROR when grams exceed 5000g", () => {
    renderComponent();

    // Select type
    fireEvent.click(screen.getByText("wasteHelper.selectType"));
    fireEvent.click(screen.getByText("mainPage.wasteTypes.paper"));

    // Select grams method
    fireEvent.click(screen.getByText("wasteHelper.selectMethod"));
    fireEvent.click(screen.getByText("wasteHelper.methods.grams"));

    fireEvent.change(screen.getByPlaceholderText("e.g., 300"), {
      target: { value: "6000" },
    });

    expect(screen.getByText("wasteHelper.excessiveAmountError")).toBeInTheDocument();
  });
});
