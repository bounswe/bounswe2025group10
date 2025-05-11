import React from "react";
import { Card, Button, Row, Col } from "react-bootstrap";

/**
 * Props
 * -----
 *  • challengeId   (number|string)
 *  • name          (string)
 *  • duration      (string | number)   // e.g. "30 days"
 *  • onDelete      (function)          // called on delete click
 */
export default function ChallengeCard({
  challengeId,
  name,
  duration,
  onDelete,
}) {
  return (
    <Card className="shadow-sm border-0 mb-4" style={{ maxWidth: "600px" }}>
      <Card.Body>
        <Row className="align-items-start">
          <Col>
            <h5 className="fw-bold text-success mb-1">{name}</h5>
            <div className="text-muted small">
              <strong>ID :</strong> {challengeId}
            </div>
            <div className="text-muted small">
              <strong>Duration :</strong> {duration}
            </div>
          </Col>

          {onDelete && (
            <Col xs="auto">
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(challengeId)}
              >
                Delete
              </Button>
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  );
}