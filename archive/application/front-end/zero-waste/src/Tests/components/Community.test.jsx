import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Community from "../../pages/Community";
import { useAuth } from "../../Login/AuthContent";

vi.mock("../../Login/AuthContent", () => ({
  useAuth: vi.fn(),
}));

describe("Community Page", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ token: "mock-token" });
  });

  it("renders the Community heading and posts", async () => {
    render(<Community />);

    // Use role+name to target the heading
    const heading = screen.getByRole("heading", { name: "Community" });
    expect(heading).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("My Zero Waste Journey")).toBeInTheDocument();
      expect(screen.getByText("Composting Tips")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    render(<Community />);
    expect(screen.getByRole("heading", { name: "Community" })).toBeInTheDocument();
    expect(document.querySelector("[aria-busy='true']")).toBeInTheDocument(); // fallback if no region
  });


  it("opens the Create Post modal", () => {
    render(<Community />);

    // Use role instead of just text
    const createButton = screen.getByRole("button", { name: "Create Post" });
    fireEvent.click(createButton);

    // Now assert modal title
    expect(screen.getByRole("heading", { name: "Create Post" })).toBeInTheDocument();
  });
});
