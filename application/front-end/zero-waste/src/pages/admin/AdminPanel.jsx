/**
 * AdminPanel.jsx  –  Post Moderation Panel with Pagination
 * ---------------------------------------------------
 * Shows a green-themed sidebar and reported posts with pagination.
 */

import React, { useState, useEffect } from "react";
import { Nav, Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";
import PostCard from "../../components/features/PostCard";

function AdminPanel({ children }) {
  const { logout } = useAuth();
  const token = localStorage.getItem("accessToken");
  const apiUrl = import.meta.env.VITE_API_URL;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);

  const getPosts = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/?page=${page}&type=posts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Admin reports data:", data);

      // Data is already filtered by backend
      setPosts(data.results || []);

      // Set pagination info
      setNextPage(data.next);
      setPreviousPage(data.previous);

      // Calculate total pages (assuming 10 items per page from backend)
      if (data.count) {
        setTotalPages(Math.ceil(data.count / 10));
      }
    } catch (error) {
      console.error("Failed to fetch admin reports:", error);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPosts(currentPage);
  }, [currentPage]);

  const deletePost = async (post_id) => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/${post_id}/moderate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "delete_media" })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Delete response:", data);

      // Refresh the list after deletion
      getPosts(currentPage);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleNextPage = () => {
    if (nextPage && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (previousPage && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  /* ─────────────────────────────────────────────────────────── */

  return (
    <Container fluid style={{ backgroundColor: "#f4fdf4", minHeight: "100vh" }}>
      <Row>
        {/* Sidebar */}
        <Col
          xs={12}
          md={3}
          className="d-flex flex-column justify-content-between p-4 text-white"
          style={{ backgroundColor: "#2e7d32", minHeight: "100vh" }}
        >
          <div>
            <h4 className="mb-4 fw-bold border-bottom pb-2">🌿 Admin Panel</h4>
            <Nav variant="pills" className="flex-column gap-2">
              <Nav.Link
                as={Link}
                to="/adminPage"
                className="text-white"
                style={{ backgroundColor: "#388e3c" }}
              >
                Post Moderation
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/challengePage"
                className="text-white"
                style={{ backgroundColor: "#388e3c" }}
              >
                Challenge Moderation
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/userPage"
                className="text-white"
                style={{ backgroundColor: "#388e3c" }}
              >
                User Moderation
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/commentPage"
                className="text-white"
                style={{ backgroundColor: "#388e3c" }}
              >
                Comment Moderation
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/activityPage"
                className="text-white"
                style={{ backgroundColor: "#388e3c" }}
              >
                Activities
              </Nav.Link>
            </Nav>
          </div>

          <div className="mt-auto">
            <Button
              variant="light"
              className="w-100 mb-3"
              onClick={logout}
            >
              Log Out
            </Button>
            <footer className="text-white-50 small">
              <div>Zero Waste Admin © 2025</div>
            </footer>
          </div>
        </Col>

        {/* Main content area */}
        <Col xs={12} md={9} className="p-5">
          <div className="mb-4">
            <h2 className="text-success fw-bold">📋 Posts</h2>
            <hr />
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Loading spinner */}
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
              <Spinner animation="border" variant="success" />
            </div>
          ) : (
            <>
              {/* Posts list */}
              <div className="d-flex flex-column align-items-center">
                {posts.length === 0 ? (
                  <Alert variant="info">No reported posts found.</Alert>
                ) : (
                  posts.map((post) => {
                    // Construct full image URL if it's a relative path
                    let imageUrl = post.content?.image;
                    if (imageUrl && !imageUrl.startsWith('http')) {
                      imageUrl = `${apiUrl}${imageUrl}`;
                    }

                    return (
                      <PostCard
                        key={post.id}
                        image={imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                        title="Reported Post"
                        description={post.content?.text ?? "No content"}
                        reportReason={post.reason}
                        reportDescription={post.description}
                        onDelete={() => deletePost(post.id)}
                      />
                    );
                  })
                )}
              </div>

              {/* Pagination controls */}
              {posts.length > 0 && (
                <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                  <Button
                    variant="success"
                    onClick={handlePreviousPage}
                    disabled={!previousPage || currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="fw-bold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="success"
                    onClick={handleNextPage}
                    disabled={!nextPage || currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Nested children (if any) */}
          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default AdminPanel;