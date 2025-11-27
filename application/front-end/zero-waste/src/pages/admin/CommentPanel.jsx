import React, { useState, useEffect } from "react";
import { Nav, Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";
import CommentCard from "../../components/features/CommentCard";

function CommentPanel({ children }) {
  const { token, logout } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);

  const getComments = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/?page=${page}&type=comments`, {
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
      setComments(data.results || []);

      // Set pagination info
      setNextPage(data.next);
      setPreviousPage(data.previous);

      // Calculate total pages
      if (data.count) {
        setTotalPages(Math.ceil(data.count / 10));
      }
    } catch (error) {
      console.error("Failed to fetch admin reports:", error);
      setError("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getComments(currentPage);
  }, [currentPage]);

  const deleteComment = async (comment_id) => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/${comment_id}/moderate/`, {
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
      getComments(currentPage);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
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
            <h2 className="text-success fw-bold">📋 Comments</h2>
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
              {/* Comments list */}
              <div className="d-flex flex-column align-items-center">
                {comments.length === 0 ? (
                  <Alert variant="info">No reported comments found.</Alert>
                ) : (
                  comments.map((c) => (
                    <CommentCard
                      key={c.id}
                      commentId={c.id}
                      username={c.author_id}
                      content={c.content?.content || "No content"}
                      reason={c.reason}
                      description={c.description}
                      onDelete={() => deleteComment(c.id)}
                    />
                  ))
                )}
              </div>

              {/* Pagination controls */}
              {comments.length > 0 && (
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

          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default CommentPanel;
