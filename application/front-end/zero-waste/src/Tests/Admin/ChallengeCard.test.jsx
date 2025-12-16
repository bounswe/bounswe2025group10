/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ChallengeCard from "@/components/features/ChallengeCard";

describe("<ChallengeCard /> (Tailwind version)", () => {
  const defaultProps = {
    id: 42,
    title: "Zero-Waste Sprint",
    description: "A challenge about sustainable habits.",
    difficulty: "Medium",
    imageUrl: "https://example.com/sample.jpg",
  };

  const renderCard = (props = defaultProps) =>
    render(
      <MemoryRouter>
        <ChallengeCard {...props} />
      </MemoryRouter>
    );

  it("renders title, description, and difficulty", () => {
    renderCard();

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.difficulty)).toBeInTheDocument();
  });

  it("renders cover image when imageUrl is provided", () => {
    renderCard();

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", defaultProps.imageUrl);
    expect(img).toHaveAttribute("alt", defaultProps.title);
  });

  it("does NOT render image when imageUrl is missing", () => {
    const props = { ...defaultProps };
    delete props.imageUrl;

    renderCard(props);

    expect(screen.queryByRole("img")).toBeNull();
  });

  it("wraps the card inside a link to /challenges/:id", () => {
    renderCard();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/challenges/${defaultProps.id}`);
  });
});
