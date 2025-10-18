import React from "react";
import { Card, Button, Row, Col } from "react-bootstrap";

/**
 * CommentCard
 * -----------
 * Props
 *  • commentId   : number|string
 *  • username    : string
 *  • description : string  (comment body)
 *  • onDelete    : function(id)  – callback when Delete is clicked
 */

export default function CommentCard({
  commentId,
  username,
  description,
  onDelete,
}) {
  return (
    <Card
      className="shadow-sm border-0 mb-3"
      style={{ maxWidth: "600px", width: "100%" }}
    >
      <Card.Body>
        <Row className="align-items-start">
          <Col>
            <div className="fw-semibold text-success">{username}</div>
            <div className="text-muted small mb-2">Comment ID : {commentId}</div>
            <Card.Text className="mb-0">{description}</Card.Text>
          </Col>

          <Col xs="auto">
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete && onDelete(commentId)}
            >
              Delete
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}