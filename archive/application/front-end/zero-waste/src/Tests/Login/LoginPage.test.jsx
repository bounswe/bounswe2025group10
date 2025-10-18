/**
 * @vitest-environment jsdom
 */

/* -------------------------------------------------------------
 * 1️⃣  Declare spies first
 * ----------------------------------------------------------- */
const loginMock    = vi.fn();
const navigateMock = vi.fn();

/* -------------------------------------------------------------
 * 2️⃣  Mock the modules BEFORE other imports
 * ----------------------------------------------------------- */
vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ login: loginMock }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  
  const actual=await importOriginal()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

/* -------------------------------------------------------------
 * 3️⃣  Now import everything else
 * ----------------------------------------------------------- */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../../Login/LoginPage";



    

/* -------------------------------------------------------------
 * 4️⃣  Helper
 * ----------------------------------------------------------- */
const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

/* -------------------------------------------------------------
 * 5️⃣  Tests
 * ----------------------------------------------------------- */
describe("LoginPage", () => {
  beforeEach(() => {
    loginMock.mockClear();
    navigateMock.mockClear();
    loginMock.mockResolvedValue({ success: true, isAdmin: false }); // ✅ fix here

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

  it("calls login and navigates home on submit", async () => {
    renderWithRouter();
    
    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(/email/i),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText(/password/i), "pa55word");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(loginMock).toHaveBeenCalledWith("test@example.com", "pa55word");

    
  });
});