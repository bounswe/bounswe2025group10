/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedUserRoute from "../../Login/ProtectedUserRoute";


/* ❶ shared token that tests can mutate */
let mockToken;


/* ---------- helpers ---------- */
const renderWithToken = (token) => {
    mockToken=token
  /* mock useAuth for this render */
  vi.mock("../../Login/AuthContent", () => ({
    useAuth: () => ({ token: mockToken }),
  }));

  render (
    <MemoryRouter initialEntries={["/secret"]}>
      <Routes>
        <Route element={<ProtectedUserRoute />}>
          {/* protected area */}
          <Route path="/secret" element={<div>SECRET PAGE</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
};

/* ---------- tests ---------- */
describe("<ProtectedUserRoute />", () => {
  it("shows protected content when token exists", () => {
    renderWithToken("abc123");
    expect(screen.getByText("SECRET PAGE")).toBeInTheDocument();
  });

  it("redirects to /login when no token", () => {
    renderWithToken(null);
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
  });
});