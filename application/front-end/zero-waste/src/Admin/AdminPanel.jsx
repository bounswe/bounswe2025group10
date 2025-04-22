import React from "react";
import { Nav, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../Login/AuthContent";

function AdminPanel({ children }) {
  const { token } = useAuth();

  return (
    <Container fluid>
      <Row>
        {/* Sidebar */}
        <Col
          xs={12}
          md={3}
          className="bg-light vh-100 p-4 border-end"
        >
          <h5 className="mb-4">Admin Dashboard</h5>
          <Nav variant="pills" className="flex-column">
            <Nav.Link as={Link} to="/adminPage">
              Post Moderation
            </Nav.Link>
            <Nav.Link as={Link} to="/challengePage">
              Challenge Moderation
            </Nav.Link>
            <Nav.Link as={Link} to="/userPage">
              User Moderation
            </Nav.Link>
            <Nav.Link as={Link} to="/commentPage">
              Comment Moderation
            </Nav.Link>
          </Nav>
        </Col>

        {/* Main content area */}
        <Col xs={12} md={9} className="p-4">
          {children /* render your page content here */}
        </Col>
      </Row>
    </Container>
  );
}

export default AdminPanel;