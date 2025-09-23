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
import { useState } from "react";

function AdminPanel({ children }) {

  const token = localStorage.getItem("accessToken"); // reserved for real API calls later
  const apiUrl = import.meta.env.VITE_API_URL; //get api 
  
  const [posts,setPosts]=useState([])
  const getPosts= async ()=>{
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
    setPosts(data.results.filter(item => item.content_type === "posts"));
  } catch (error) {
    console.error("Failed to fetch admin reports:", error);
  }
}
  getPosts()
    
 //deletes given post given 
const deletePost=async (post_id)=>{
  try {
    const response = await fetch(`${apiUrl}/api/admin/reports/${post_id}/moderate/`, {
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
  console.error("Error deleting post:", error);
}
}

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

          {posts.map((post) => (
            <PostCard
              key={post.id}
              image={post.content?.image || "https://via.placeholder.com/400x300?text=No+Image"}
              title={`Report: ${post.reason}`}
              description={post.content?.text ?? "No description provided."}
              onDelete={() => deletePost(post.id)}
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