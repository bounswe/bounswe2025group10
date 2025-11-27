/**
 * @vitest-environment jsdom
 */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

import Community from "../../pages/Community";

/* ------------------ MOCK AUTH CONTEXT ------------------ */
vi.mock("../../providers/AuthContext", () => ({
  useAuth: () => ({
    token: "mock-token",
    user: { username: "asya" }
  }),
}));

/* ------------------ MOCK LANGUAGE CONTEXT ------------------ */
vi.mock("../../providers/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key, fallback) => fallback ?? key,
    isRTL: false,
    language: "en",
    availableLanguages: [
      { code: "en", name: "English", flag: "🇬🇧" },
      { code: "tr", name: "Türkçe", flag: "🇹🇷" },
    ],
    changeLanguage: vi.fn(),
  }),
}));

/* ------------------ MOCK THEME CONTEXT (THE FIX) ------------------ */
vi.mock("../../providers/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    currentTheme: {
      text: "#000",
      background: "#fff",
      border: "#ddd",
      secondary: "#4caf50",
    },
    availableThemes: [
      { code: "light", icon: "🌞" },
      { code: "dark", icon: "🌙" },
    ],
    changeTheme: vi.fn(),
  }),
}));

/* ------------------ MOCK usePosts HOOK ------------------ */
const mockFetchPosts = vi.fn();
const mockToggleLike = vi.fn();
const mockToggleDislike = vi.fn();
const mockSavePost = vi.fn();
const mockUnsavePost = vi.fn();
const mockFetchSavedPosts = vi.fn();

vi.mock("../../hooks/usePosts", () => ({
  usePosts: () => ({
    posts: [
      {
        id: 1,
        text: "Hello community!",
        creator_username: "asya",
        creator_profile_image: "",
        date: new Date().toISOString(),
        like_count: 10,
        dislike_count: 1,
        is_user_liked: false,
        is_user_disliked: false,
      },
    ],
    postsLoading: false,
    createPost: vi.fn(),
    createLoading: false,
    toggleLike: mockToggleLike,
    toggleDislike: mockToggleDislike,
    savedPosts: [],
    savedPostIds: new Set(),
    savePost: mockSavePost,
    unsavePost: mockUnsavePost,
    fetchSavedPosts: mockFetchSavedPosts,
    fetchPosts: mockFetchPosts,
    postsResponse: { next: null, previous: null, count: 1 },
    setPostsResponse: vi.fn(),
  }),
}));

/* ------------------ MOCK useComments HOOK ------------------ */
vi.mock("../../hooks/useComments", () => ({
  useComments: () => ({
    postComments: {},
    commentInputs: {},
    commentLoading: false,
    fetchComments: vi.fn(),
    createComment: vi.fn(),
    reportComment: vi.fn(),
    updateCommentInput: vi.fn(),
  }),
}));

/* ------------------ SUPPRESS TOASTS ------------------ */
vi.mock("../../utils/toast", () => ({
  showToast: vi.fn(),
}));

/* ===========================================================
   TESTS
   =========================================================== */

describe("<Community />", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <Community />
      </MemoryRouter>
    );

  it("renders the Community page title", () => {
    renderPage();
    expect(screen.getByText("Community")).toBeInTheDocument();
  });

  it("calls fetchPosts on mount", () => {
    renderPage();
    expect(mockFetchPosts).toHaveBeenCalled();
  });

  it("renders a post card", () => {
    renderPage();
    expect(screen.getByText("Hello community!")).toBeInTheDocument();
    expect(screen.getByText("asya")).toBeInTheDocument();
  });


  it("toggles saved posts mode", () => {
    renderPage();

    const btn = screen.getByRole("button", { name: /show saved posts/i });
    fireEvent.click(btn);

    expect(mockFetchSavedPosts).toHaveBeenCalled();
  });

});
