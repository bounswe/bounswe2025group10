import React from "react";
import { Card, Button, Row, Col } from "react-bootstrap";

/**
 * Props
 * -----
 *  • challengeId   (number|string)
 *  • name          (string)
 *  • duration      (string | number)   // e.g. "30 days"
 *  • reason        (string)            // report reason
 *  • description   (string)            // report description
 *  • onDelete      (function)          // called on delete click
 */
export default function ChallengeCard({
  challengeId,
  name,
  duration,
  reason,
  description,
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
              <strong>Challenge progress :</strong> {duration}
            </div>
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