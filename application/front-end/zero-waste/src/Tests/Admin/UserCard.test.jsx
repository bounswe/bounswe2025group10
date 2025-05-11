/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UserCard from "../../Admin/UserCard";   // ← adjust path if needed

describe("<UserCard />", () => {
  it("shows the username and badge counts", () => {
    render(
      <UserCard
        username="eco_ninja"
        flaggedPosts={2}
        flaggedComments={1}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText("eco_ninja")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();    // posts badge
    expect(screen.getByText("1")).toBeInTheDocument();    // comments badge
  });

  it("calls onDelete with username when Delete is clicked", () => {
    const delSpy = vi.fn();
    render(<UserCard username="green_guru" onDelete={delSpy} />);

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(delSpy).toHaveBeenCalledTimes(1);
    expect(delSpy).toHaveBeenCalledWith("green_guru");
  });
});