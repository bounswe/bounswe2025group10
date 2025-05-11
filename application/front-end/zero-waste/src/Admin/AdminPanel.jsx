/**
 * AdminPanel.jsx  –  mock version with Picsum images
 * ---------------------------------------------------
 * Shows a green-themed sidebar and a list of demo posts.
 * Image URLs now use picsum.photos (no redirect issues).
 */

import React from "react";
import { Nav, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../Login/AuthContent";
import PostCard from "./PostCard";

function AdminPanel({ children }) {
  const { token } = useAuth(); // reserved for real API calls later

  /* ▸▸ MOCK DATA (using picsum.photos) ───────────────────────── */
  const mockPosts = [
    {
      id: 1,
      image: "https://picsum.photos/seed/compost/600/300",
      title: "Composting 101",
      description:
        "A beginner-friendly guide on turning kitchen scraps into nutrient-rich soil.",
    },
    {
      id: 2,
      image: "https://picsum.photos/seed/plasticfree/600/300",
      title: "Plastic-Free July Recap",
      description:
        "See how our community reduced 80 kg of single-use plastic in one month.",
    },
    {
      id: 3,
      image: "https://picsum.photos/seed/recycle/600/300",
      title: "Recycling Myths Busted",
      description:
        "We debunk the 7 most common misconceptions about household recycling.",
    },
  ];
  /* ──────────────────────────────────────────────────────────── */

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
            <h2 className="text-success fw-bold">📋 Posts</h2>
            <hr />
          </div>

          {/* Mock posts - centered */}
          <div className="d-flex flex-column align-items-center">
            {mockPosts.map((post) => (
              <PostCard
                key={post.id}
                image={post.image}
                title={post.title}
                description={post.description}
                onDelete={() => console.log(`Delete post ${post.id}`)}
              />
            ))}
          </div>

          {/* Nested children (if any) */}
          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default AdminPanel;