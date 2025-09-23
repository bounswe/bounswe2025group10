// `application/front-end/zero-waste/src/Tests/pages/Tips.test.jsx`
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Tips from "../../pages/Tips";

describe("Tips Page", () => {
  it("renders the Tips page with tips", async () => {
    render(<Tips />);
    expect(screen.getByText("Sustainability Tips")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Use Reusable Bags")).toBeInTheDocument();
      expect(screen.getByText("Compost Food Waste")).toBeInTheDocument();
    });
  });

  it('renders the Create Tip button', () => {
    render(<Tips />);
    const createTipButton = screen.getByRole('button', { name: 'Create Tip' });
    expect(createTipButton).toBeInTheDocument();
  });

  it("finds the Create Tip button", () => {
    render(<Tips />);
    const createTipButton = screen.getByRole("button", { name: "Create Tip" });
    expect(createTipButton).toBeInTheDocument();
  });
});