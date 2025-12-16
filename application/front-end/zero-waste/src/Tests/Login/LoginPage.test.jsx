/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";


const loginMock = vi.fn();
const navigateMock = vi.fn();


vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});


import LoginPage from "../../pages/auth/LoginPage";


function renderWithRouter() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

/* -------------------------------------------------------------
 * 5️⃣  TESTS
 * ----------------------------------------------------------- */
describe("<LoginPage />", () => {
  beforeEach(() => {
    loginMock.mockClear();
    navigateMock.mockClear();

    // Default mock response
    loginMock.mockResolvedValue({
      success: true,
      isAdmin: false,
    });
  });

  it("renders the key form elements", () => {
    renderWithRouter();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/signup"
    );
  });

  it("submits email + password to login()", async () => {
    renderWithRouter();

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "pa55word");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(loginMock).toHaveBeenCalledWith("test@example.com", "pa55word");
  });
});
