/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";

// ① Stub out useAuth so we don’t need real auth
vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ token: "fake-token" }),
}));

// ② Import after the mock
import ChallengePanel from "../../Admin/ChallengePanel";

describe("<ChallengePanel />", () => {
  it("renders the sidebar links", () => {
    render(
      <MemoryRouter>
        <ChallengePanel />
      </MemoryRouter>
    );

    // Check that “Post Moderation” and “Challenge Moderation” links appear
    expect(
      screen.getByRole("link", { name: /post moderation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /challenge moderation/i })
    ).toBeInTheDocument();
  });

  it("renders all mock challenge names", () => {
    render(
      <MemoryRouter>
        <ChallengePanel />
      </MemoryRouter>
    );

    expect(screen.getByText(/Plastic/i)).toBeInTheDocument();
    expect(screen.getByText("Zero‑Waste Lunch")).toBeInTheDocument();
    expect(screen.getByText("Composting Sprint")).toBeInTheDocument();
  });
});