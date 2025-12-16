/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

/* ---------- mock AuthContext ---------- */
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    token: "mock-token",
    apiUrl: "http://mock-api.com",
  }),
}));

/* ---------- mock fetch ---------- */
const mockUsers = {
  results: [
    { username: "green_guru", id: 1 },
    { username: "eco_ninja", id: 2 },
    { username: "waste_warrior", id: 3 },
  ],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockUsers),
  }));
});

/* ---------- component under test ---------- */
import UserPanel from "../../pages/admin/UserPanel";

/* ---------- helper ---------- */
const renderUserPanel = () =>
  render(
    <MemoryRouter>
      <UserPanel />
    </MemoryRouter>
  );

/* ---------- TESTS ---------- */
describe("<UserPanel />", () => {
 

  it("shows the Post Moderation link in sidebar", async () => {
    renderUserPanel();

    expect(
      screen.getByRole("link", { name: /post moderation/i })
    ).toBeInTheDocument();
  });
});
