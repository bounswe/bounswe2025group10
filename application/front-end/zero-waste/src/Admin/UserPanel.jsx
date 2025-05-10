import React from "react";
import { Nav, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../Login/AuthContent";
import UserCard from "./UserCard";

function UserPanel({ children }) {
  const { token } = useAuth();

  // ▸▸ MOCK USERS ──────────────────────────────
  const mockUsers = [
    { username: "green_guru", flaggedPosts: 2, flaggedComments: 5 },
    { username: "eco_ninja",  flaggedPosts: 0, flaggedComments: 1 },
    { username: "waste_warrior", flaggedPosts: 3, flaggedComments: 0 }
  ];
  // ────────────────────────────────────────────

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
            </Nav>
          </div>

          <footer className="mt-4 text-white-50 small">
            <div>Zero Waste Admin © 2025</div>
          </footer>
        </Col>

        {/* Main content area */}
        <Col xs={12} md={9} className="p-5">
          <div className="mb-4">
            <h2 className="text-success fw-bold">📋 Users</h2>
            <hr />
          </div>
          {/* Centered mock user cards */}
          <div className="d-flex flex-column align-items-center">
            {mockUsers.map((u) => (
              <UserCard
                key={u.username}
                username={u.username}
                flaggedPosts={u.flaggedPosts}
                flaggedComments={u.flaggedComments}
                onDelete={(user) => console.log("Delete user", user)}
              />
            ))}
          </div>
          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default UserPanel;
