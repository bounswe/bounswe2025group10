import React from "react";
import { Nav, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../Login/AuthContent";
import CommentCard from "./CommentCard";
import { useState } from "react";

function CommentPanel({ children }) {
  const { token } = useAuth();
  const [comments,setComments]=useState([])
  const apiUrl = import.meta.env.VITE_API_URL; //get api 

  // ▸▸  COMMENTS ──────────────────────────────
  const getComments= async ()=>{
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    
      const data = await response.json();
      console.log(data);
      setComments(data.results.filter(item => item.content_type === "comments"));
    } catch (error) {
      console.error("Failed to fetch admin reports:", error);
    }
  }
    getComments() //get comments
      
   //deletes given post given 
  const deleteComment=async (comment_id)=>{
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/${comment_id}/moderate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "delete_media" })
      });
    
      const data = await response.json();
      console.log(data);
  }
  catch (error) {
    console.error("Error deleting comment:", error);
  }
  }
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
            <h2 className="text-success fw-bold">📋 Comments</h2>
            <hr />
          </div>
          {/* Centered mock comment cards */}
          <div className="d-flex flex-column align-items-center">
            {comments.map((c) => (
              <CommentCard
                key={c.id}
                commentId={c.id}
                username={c.author_id}
                description={c.description}
                onDelete={(id) => deleteComment(c.id)}
              />
            ))}
          </div>
          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default CommentPanel;
