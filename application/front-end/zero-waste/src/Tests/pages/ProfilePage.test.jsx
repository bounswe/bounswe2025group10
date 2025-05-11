import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfilePage from "../../pages/ProfilePage.jsx";

// ───── Minimal mock for AuthContext ─────
vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

// ───── Stub the Post component ─────
vi.mock("../../components/Post", () => ({
  default: () => <div />,
}));

describe("<ProfilePage />", () => {
  it("renders without crashing", () => {
    const { container } = render(<ProfilePage />);
    expect(container).toBeTruthy();
  });

  it("contains a header (h3) and at least one button", async () => {
    render(<ProfilePage />);
    
    // Heading (profile name) exists
    const header = await screen.findByRole("heading", { level: 3 });
    expect(header).toBeInTheDocument();

    // Button (e.g., Save)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});