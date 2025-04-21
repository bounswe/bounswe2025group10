/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../../Login/LoginPage";          
import type * as ReactRouterDom from "react-router-dom";    // adjust if your path differs

/* ------------------------------------------------------------------ */
/* 1.  Create reusable mocks for `login` and `navigate` -------------- */
/* ------------------------------------------------------------------ */
const loginMock = vi.fn();
const navigateMock = vi.fn();

/* Mock the modules *before* importing the component that uses them.  */
vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ login: loginMock }),          // only what LoginPage needs
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof ReactRouterDom>("react-router-dom");
  return {
    ...actual,                                    // keep everything else intact
    useNavigate: () => navigateMock,
  };
});

/* ------------------------------------------------------------------ */
/* 2.  Helper: render with a router wrapper -------------------------- */
/* ------------------------------------------------------------------ */
const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

/* ------------------------------------------------------------------ */
/* 3.  Tests --------------------------------------------------------- */
/* ------------------------------------------------------------------ */
describe("LoginPage", () => {
  /*  Reset mock call history between tests  */
  beforeEach(() => {
    loginMock.mockClear();
    navigateMock.mockClear();
  });

  it("renders the key form elements", () => {
    renderWithRouter();

    /* Input placeholders and button label should appear */
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();

    /* The sign‑up link exists and points to /signup */
    const signupLink = screen.getByRole("link", { name: /sign up/i });
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("calls `login` with email + password and then navigates home", async () => {
    renderWithRouter();
    const user = userEvent.setup();

    /* Type credentials */
    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "pa55word");

    /* Submit form */
    await user.click(screen.getByRole("button", { name: /login/i }));

    /* Assertions */
    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(loginMock).toHaveBeenCalledWith("test@example.com", "pa55word");
    expect(navigateMock).toHaveBeenCalledWith("/"); // redirected to home
  });
});