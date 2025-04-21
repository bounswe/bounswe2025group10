/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "../../Login/SignupPage";
import { MemoryRouter } from "react-router-dom";

/* ---------------- MOCKS ------------------- */
const signupMock = vi.fn();

vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({
    signup: signupMock,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/* ---------------- RENDER UTILITY ------------------- */
import { AuthProvider } from "../../Login/AuthContent"; // 👈 make sure this matches your path

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    </MemoryRouter>
  );
/* ---------------- TEST CASES ------------------- */
describe("SignupPage", () => {
  beforeEach(() => {
    signupMock.mockClear();
  });

  it("renders form elements correctly", () => {
    renderWithRouter();

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("calls signup with email and password on form submit", async () => {
    renderWithRouter();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), "newuser@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(signupMock).toHaveBeenCalledTimes(1);
    expect(signupMock).toHaveBeenCalledWith("newuser@example.com", "secret123");
  });
});