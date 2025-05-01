import React from "react";
import { Nav, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../Login/AuthContent";
import ChallengeCard from "./ChallengeCard";

function ChallengePanel({ children }) {
  const { token } = useAuth();

    // ▸▸ MOCK CHALLENGES ──────────────────────────────
    const mockChallenges = [
      {
        challengeId: 1,
        name: "Plastic‑Free Week",
        duration: "7 days"
      },
      {
        challengeId: 2,
        name: "Zero‑Waste Lunch",
        duration: "5 days"
      },
      {
        challengeId: 3,
        name: "Composting Sprint",
        duration: "14 days"
      }
    ];
    // ────────────────────────────────────────────────
  
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
            <h2 className="text-success fw-bold">📋 Challenges</h2>
            <hr />
          </div>
          {/* Centered mock challenges list */}
          <div className="d-flex flex-column align-items-center">
            {mockChallenges.map((ch) => (
              <ChallengeCard
                key={ch.challengeId}
                challengeId={ch.challengeId}
                name={ch.name}
                duration={ch.duration}
                onDelete={(id) => console.log(`Delete challenge ${id}`)}
              />
            ))}
          </div>
          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default ChallengePanel;