/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";

/* ── mock useAuth so component mounts without real auth ───────── */
vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ token: "fake-token" }),
}));

/* ── component under test (update the path if needed) ─────────── */
import AdminPanel from "../../Admin/AdminPanel";

describe("<AdminPanel />", () => {
  it("renders the post titles", () => {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>
    );

    //will do later when posts are present.
  });

  it("renders the sidebar with Post Moderation link", () => {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: /post moderation/i })
    ).toBeInTheDocument();
  });
});