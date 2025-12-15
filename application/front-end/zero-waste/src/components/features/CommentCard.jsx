import React from "react";
import { Card, Button, Row, Col } from "react-bootstrap";

/**
 * CommentCard
 * -----------
 * Props
 *  • commentId   : number|string
 *  • username    : string
 *  • content     : string  (comment body)
 *  • reason      : string  (report reason)
 *  • description : string  (report description)
 *  • onDelete    : function(id)  – callback when Delete is clicked
 */

export default function CommentCard({
  commentId,
  username,
  content,
  reason,
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
            <Card.Text className="mb-2">{content}</Card.Text>
            {reason && (
              <div className="mt-2">
                <strong className="text-danger">Report Reason:</strong> {reason}
              </div>
            )}
            {description && (
              <div className="text-muted small mt-1">
                <strong>Description:</strong> {description}
              </div>
            )}
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