/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UserCard from "@/components/features/UserCard";

// Mock ThemeContext
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#ffffff",
      text: "#000000",
      secondary: "#00ff00",
      border: "#cccccc",
    },
  }),
}));

describe("<UserCard />", () => {
  it("shows the username and badge counts", () => {
    render(
      <UserCard
        username="eco_ninja"
        flaggedPosts={2}
        flaggedComments={1}
        onDelete={() => { }}
      />
    );

    expect(
      screen.getByText((text) => text.includes("eco_ninja"))
    ).toBeInTheDocument();

    // badges
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("calls onDelete with username when Delete is clicked", () => {
    const delSpy = vi.fn();
    render(
      <UserCard
        username="green_guru"
        flaggedPosts={0}
        flaggedComments={0}
        onDelete={delSpy}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(delSpy).toHaveBeenCalledTimes(1);
    expect(delSpy).toHaveBeenCalledWith("green_guru");
  });
});
