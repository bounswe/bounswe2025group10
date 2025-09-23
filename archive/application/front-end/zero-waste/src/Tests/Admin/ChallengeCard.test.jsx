/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChallengeCard from "../../Admin/ChallengeCard"; // ← adjust path as needed

describe("<ChallengeCard />", () => {
  const defaultProps = {
    challengeId: 42,
    name: "Zero-Waste Sprint",
    duration: "14 days",
  };

  it("renders name, ID, and duration correctly without delete button", () => {
    render(<ChallengeCard {...defaultProps} />);

    // Check that the challenge name appears
    expect(screen.getByText(defaultProps.name)).toBeInTheDocument();

    // Check that the ID is rendered
    expect(screen.getByText(/42/i)).toBeInTheDocument();

    expect(screen.getByText(/ID/i)).toBeInTheDocument();

    // Check that the duration is rendered
    expect(screen.getByText(/14 days/i)).toBeInTheDocument();

    // Since onDelete is not provided, no Delete button should exist
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("shows Delete button when onDelete is provided and calls it with the ID", () => {
    const onDelete = vi.fn();
    render(<ChallengeCard {...defaultProps} onDelete={onDelete} />);

    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(defaultProps.challengeId);
  });
});