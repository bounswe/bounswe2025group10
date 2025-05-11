/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Alert from "../../Login/Alert";     // adjust the relative path if needed

describe("<Alert />", () => {
  it("renders the given message and bootstrap classes", () => {
    render(<Alert message="Hello!" type="success" />);

    const alertBox = screen.getByRole("alert");
    expect(alertBox).toHaveTextContent("Hello!");
    expect(alertBox).toHaveClass("alert-success");
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<Alert message="Dismiss me" onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});