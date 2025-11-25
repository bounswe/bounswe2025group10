/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import CommentCard from "@/components/features/CommentCard"; // ← adjust this path

describe("<CommentCard />", () => {
  it("renders username, comment ID, description, and Delete button", () => {
    render(
      <CommentCard
        commentId={123}
        username="user1"
        description="This is a test comment."
      />
    );

    // Username
    expect(screen.getByText("user1")).toBeInTheDocument();
    // Comment ID line
    expect(screen.getByText("Comment ID : 123")).toBeInTheDocument();
    // Description
    expect(screen.getByText("This is a test comment.")).toBeInTheDocument();
    // Delete button
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls onDelete with the commentId when Delete is clicked", async () => {
    const onDelete = vi.fn();
    render(
      <CommentCard
        commentId={45}
        username="user2"
        description="Another comment"
        onDelete={onDelete}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: /delete/i })
    );
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(45);
  });
});