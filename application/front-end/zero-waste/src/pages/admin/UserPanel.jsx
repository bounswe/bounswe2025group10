import React, { useState, useEffect } from "react";
import { Nav, Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";
import UserCard from "../../components/features/UserCard";

function UserPanel({ children }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);

  const getUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/?page=${page}&type=users`, {
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
      setUsers(data.results || []);

      // Set pagination info
      setNextPage(data.next);
      setPreviousPage(data.previous);

      // Calculate total pages
      if (data.count) {
        setTotalPages(Math.ceil(data.count / 10));
      }
    } catch (error) {
      console.error("Failed to fetch user reports:", error);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers(currentPage);
  }, [currentPage]);

  const deleteUser = async (user_id) => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/${user_id}/moderate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "ban_user" })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Ban user response:", data);

      // Refresh the list after deletion
      getUsers(currentPage);
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Failed to ban user. Please try again.");
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
            <h2 className="text-success fw-bold">📋 Users</h2>
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
              {/* Users list */}
              <div className="d-flex flex-column align-items-center">
                {users.length === 0 ? (
                  <Alert variant="info">No reported users found.</Alert>
                ) : (
                  users.map((u) => (
                    <UserCard
                      key={u.id}
                      username={u.object_id || u.content?.username || "Unknown User"}
                      flaggedPosts={u.flaggedPosts || 0}
                      flaggedComments={u.flaggedComments || 0}
                      onDelete={() => deleteUser(u.id)}
                    />
                  ))
                )}
              </div>

              {/* Pagination controls */}
              {users.length > 0 && (
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

export default UserPanel;
