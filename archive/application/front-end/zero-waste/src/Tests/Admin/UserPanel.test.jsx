/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";

/* ---------- mock useAuth so component won't crash ---------- */
vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ token: "mock-token" }),
}));

/* ---------- component under test --------------------------- */
import UserPanel from "../../Admin/UserPanel";

/* ---------- helper to render with router ------------------- */
const renderUserPanel = () =>
  render(
    <MemoryRouter>
      <UserPanel />
    </MemoryRouter>
  );

/* ---------- tests ----------------------------------------- */
describe("<UserPanel />", () => {
  it("renders three mock user cards", () => {
    renderUserPanel();

    expect(screen.getByText("green_guru")).toBeInTheDocument();
    expect(screen.getByText("eco_ninja")).toBeInTheDocument();
    expect(screen.getByText("waste_warrior")).toBeInTheDocument();
  });

  it("shows the Post Moderation link in sidebar", () => {
    renderUserPanel();

    expect(
      screen.getByRole("link", { name: /post moderation/i })
    ).toBeInTheDocument();
  });
});