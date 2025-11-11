import React from "react";
import { Nav, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";
import ChallengeCard from "../../components/features/AdminChallengeCard";
import { useState } from "react";

function ChallengePanel({ children }) {
  const { token } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL; //get api 
  const [challenges,setChallenges]=useState([])
    // ▸▸ CHALLENGES ──────────────────────────────
    const getChallenges= async ()=>{
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

        setChallenges(data.results.filter(item => item.content_type === "challenge"));

      } catch (error) {
        console.error("Failed to fetch admin reports:", error);
      }
    }
      getChallenges() //get comments
        
     //deletes given post given 
    const deleteChallenge=async (challenge_id)=>{
      try {
        const response = await fetch(`${apiUrl}/api/admin/reports/${challenge_id}/moderate/`, {
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
      console.error("Error deleting challenge:", error);
    }
    }
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
            {challenges.map((ch) => (
              <ChallengeCard
                key={ch.id}
                challengeId={ch.id}

                name={ch.content.title}
                duration={ch.content.current_progress}

                onDelete={(id) => deleteChallenge(ch.id)}
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