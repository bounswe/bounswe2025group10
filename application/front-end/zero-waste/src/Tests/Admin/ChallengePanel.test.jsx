/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ChallengePanel from "@/pages/admin/ChallengePanel";


// Mock AuthContext
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    token: "mock-token",
  }),
}));

// Mock AdminChallengeCard
vi.mock("../../components/features/AdminChallengeCard", () => ({
  __esModule: true,
  default: ({ challengeId, name, duration, onDelete }) => (
    <div data-testid="challenge-card">
      <div>{name}</div>
      <div>{duration}</div>
      <button onClick={() => onDelete(challengeId)}>Delete</button>
    </div>
  ),
}));

describe("<ChallengePanel />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays ONLY challenge-type items", async () => {
    // Mock GET /reports/
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          results: [
            {
              id: 1,
              content_type: "challenge",
              content: { title: "Recycle Marathon", current_progress: "50%" },
            },
            {
              id: 2,
              content_type: "post",
              content: {},
            },
          ],
        }),
    });

    // Wrapped in act to avoid warnings
    await act(async () => {
      render(
        <MemoryRouter>
          <ChallengePanel />
        </MemoryRouter>
      );
    });

    // Expect correct URL (REAL one)
    expect(global.fetch).toHaveBeenCalledWith(
      "https://zerowaste.ink/api/admin/reports/",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
      })
    );

    // Challenge rendered
    expect(await screen.findByText("Recycle Marathon")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

    // Only 1 challenge card rendered
    expect(screen.getAllByTestId("challenge-card")).toHaveLength(1);
  });

  it("calls deleteChallenge when Delete button is clicked", async () => {
    // Mock GET → challenge list
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            results: [
              {
                id: 99,
                content_type: "challenge",
                content: {
                  title: "Eco Battle",
                  current_progress: "20%",
                },
              },
            ],
          }),
      })
      // Mock POST → delete
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

    await act(async () => {
      render(
        <MemoryRouter>
          <ChallengePanel />
        </MemoryRouter>
      );
    });

    // Challenge appears
    expect(await screen.findByText("Eco Battle")).toBeInTheDocument();

    // Click delete
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    // Now check POST call (REAL URL!)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        "https://zerowaste.ink/api/admin/reports/99/moderate/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
          body: JSON.stringify({ action: "delete_media" }),
        })
      );
    });
  });
});
