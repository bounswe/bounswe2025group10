import React, { useState, useEffect } from "react";
import { Nav, Container, Row, Col, Button, Spinner, Alert, Badge, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";
import ActivityCard from "../../components/features/ActivityCard";

function ActivityPanel({ children }) {
  const { token, logout } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterActor, setFilterActor] = useState("");

  const getActivities = async (page = 1) => {
    setLoading(true);
    setError(null);
    const itemsPerPage = 15;

    // Build query params
    let queryParams = `page=${page}&page_size=${itemsPerPage}`;
    if (filterType) {
      queryParams += `&type=${filterType}`;
    }
    if (filterActor) {
      queryParams += `&actor_id=${filterActor}`;
    }

    try {
      const response = await fetch(`${apiUrl}/api/activity-events/?${queryParams}`, {
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
      console.log("Activity events data:", data);

      // ActivityStreams 2.0 format response
      setActivities(data.items || []);
      setTotalItems(data.totalItems || 0);

      // Check if there are more pages
      setHasNext(data.totalItems > page * itemsPerPage);
      setHasPrevious(page > 1);
    } catch (error) {
      console.error("Failed to fetch activity events:", error);
      setError("Failed to load activity events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getActivities(currentPage);
  }, [currentPage, filterType, filterActor]);

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    getActivities(1);
  };

  const handleClearFilters = () => {
    setFilterType("");
    setFilterActor("");
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPrevious) {
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
            <h2 className="text-success fw-bold mb-0">📊 Activity Events</h2>
            <p className="text-muted small">
              Total: {totalItems} events
            </p>
          </div>

          {/* Filters */}
          <div className="mb-4 p-3 bg-light rounded">
            <h5 className="mb-3">Filters</h5>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Create">Create</option>
                  <option value="Update">Update</option>
                  <option value="Delete">Delete</option>
                  <option value="Follow">Follow</option>
                  <option value="Like">Like</option>
                  <option value="Announce">Announce</option>
                  <option value="Accept">Accept</option>
                  <option value="Reject">Reject</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Actor ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter actor ID..."
                  value={filterActor}
                  onChange={(e) => setFilterActor(e.target.value)}
                />
              </Col>
              <Col md={4} className="d-flex align-items-end">
                <Button
                  variant="outline-secondary"
                  onClick={handleClearFilters}
                  className="w-100"
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </div>
          <hr />

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
              {/* Activities list */}
              <div className="d-flex flex-column align-items-center">
                {activities.length === 0 ? (
                  <Alert variant="info">No activity events found.</Alert>
                ) : (
                  activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                    />
                  ))
                )}
              </div>

              {/* Pagination controls */}
              {activities.length > 0 && (
                <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                  <Button
                    variant="success"
                    onClick={handlePreviousPage}
                    disabled={!hasPrevious}
                  >
                    Previous
                  </Button>
                  <span className="fw-bold">
                    Page {currentPage}
                  </span>
                  <Button
                    variant="success"
                    onClick={handleNextPage}
                    disabled={!hasNext}
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

export default ActivityPanel;
