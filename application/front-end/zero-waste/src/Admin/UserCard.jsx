import React from "react";
import { Card, Button, Row, Col, Badge } from "react-bootstrap";

/**
 * Props
 * -----
 * username          : string  – user handle / email
 * flaggedPosts      : number  – count of posts flagged for moderation
 * flaggedComments   : number  – count of comments flagged for moderation
 * onDelete          : function(user)  – callback when delete is clicked
 */
export default function UserCard({
  username,
  flaggedPosts = 0,
  flaggedComments = 0,
  onDelete,
}) {
  return (
    <Card
      className="shadow-sm border-0 mb-3"
      style={{ maxWidth: "500px", width: "100%" }}
    >
      <Card.Body>
        <Row className="align-items-center">
          {/* User name */}
          <Col xs>
            <h5 className="fw-bold mb-1 text-success">{username}</h5>

            <div className="small text-muted">
              Flagged Posts&nbsp;
              <Badge bg={flaggedPosts ? "warning" : "secondary"}>
                {flaggedPosts}
              </Badge>
            </div>

            <div className="small text-muted mt-1">
              Flagged Comments&nbsp;
              <Badge bg={flaggedComments ? "warning" : "secondary"}>
                {flaggedComments}
              </Badge>
            </div>
          </Col>

          {/* Delete */}
          <Col xs="auto">
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete && onDelete(username)}
            >
              Delete
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}