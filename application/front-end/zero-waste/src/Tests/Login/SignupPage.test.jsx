/**
 * @vitest-environment jsdom
 */


const signupMock = vi.fn(async () => true);

vi.mock("../../Login/AuthContent", () => ({
  useAuth: () => ({ signup: signupMock }),
  default: ({ children }) => <>{children}</>, // stub AuthProvider
}));


import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "../../Login/SignupPage";
import { MemoryRouter } from "react-router-dom";



describe("Signup Page",()=>{

  it("renders UI components",()=>{

    //render the sign up page component
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
  

    const username=screen.getByLabelText(/username/i)
    const password=screen.getByLabelText(/password/i)
    const email=screen.getByLabelText(/email/i)
    const button=screen.getByRole("button", { name: /sign up/i })
    

    expect(username).toBeInTheDocument()
    expect(password).toBeInTheDocument()
    expect(email).toBeInTheDocument()
    expect(button).toBeInTheDocument()

  })


  it("when clicked to the button, it must send email,username,password ",async ()=>{



    

    //render the sign up page component
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
  

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/username/i), 'tester');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');

    await userEvent.click(
      screen.getByRole("button", { name: /sign up/i })
    );

    expect(signupMock).toHaveBeenCalledOnce()
    expect(signupMock).toHaveBeenCalledWith(
      "test@example.com",
      "tester",
      "secret123"
    );

  })


}) 