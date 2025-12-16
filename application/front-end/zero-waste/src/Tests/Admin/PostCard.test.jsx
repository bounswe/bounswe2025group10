/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PostCard from "@/components/features/PostCard";

// Mock ThemeContext
vi.mock("@/providers/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      background: "#ffffff",
      text: "#000000",
      secondary: "#00ff00",
      border: "#cccccc",
    },
  }),
}));
describe("<PostCard />", () => {
  const mockProps = {
    image: "https://picsum.photos/600/300",
    title: "Test Title",
    description: "This is a test description.",
  };

  it("renders image, title and description correctly", () => {
    render(<PostCard {...mockProps} />);

    // img should have the right alt and src
    const img = screen.getByAltText("Post");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", mockProps.image);

    // title & description
    expect(screen.getByText(mockProps.title)).toBeInTheDocument();
    expect(screen.getByText(mockProps.description)).toBeInTheDocument();

    // without onDelete, no button
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("shows Delete button when onDelete is provided and calls it on click", async () => {
    const onDelete = vi.fn();
    render(<PostCard {...mockProps} onDelete={onDelete} />);

    // button appears
    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toBeInTheDocument();

    // click it
    await userEvent.click(btn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});