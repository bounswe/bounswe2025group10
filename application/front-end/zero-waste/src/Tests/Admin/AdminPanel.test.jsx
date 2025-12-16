/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import AdminPanel from "@/pages/admin/AdminPanel";

vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ token: "fake-token" }),
}));



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