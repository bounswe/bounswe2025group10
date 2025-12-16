/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "../../pages/auth/SignupPage";

// ----------- MOCK AuthContext -----------
const signupMock = vi.fn().mockResolvedValue({
  success: true,
  message: "Created",
});

vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    signup: signupMock,
  }),
}));

// ----------- MOCK react-router navigate -----------
const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// ----------- mock toast -----------
vi.mock("../../utils/toast.js", () => ({
  showToast: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================
//                     TESTS
// =====================================================
describe("Signup Page", () => {
  it("renders UI components", () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("when submit clicked → sends email, username, password", async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "asya@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "asya" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "12345678" },
    });

    fireEvent.click(screen.getByText("Sign Up"));

    await waitFor(() =>
      expect(signupMock).toHaveBeenCalledWith(
        "asya@example.com",
        "asya",
        "12345678"
      )
    );
  });
});
