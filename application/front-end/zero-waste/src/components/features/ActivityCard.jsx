import React from "react";
import { Card, Badge, Row, Col } from "react-bootstrap";

/**
 * ActivityCard
 * -----------
 * Displays an ActivityStreams 2.0 event
 * Props:
 *  • activity: object (ActivityStreams 2.0 format)
 */

const getActivityTypeColor = (type) => {
  const typeColors = {
    Create: "success",
    Update: "info",
    Delete: "danger",
    Follow: "primary",
    Like: "warning",
    Announce: "secondary",
  };
  return typeColors[type] || "secondary";
};

const getVisibilityBadge = (visibility) => {
  const badges = {
    PUBLIC: { variant: "success", text: "Public" },
    UNLISTED: { variant: "info", text: "Unlisted" },
    FOLLOWERS: { variant: "warning", text: "Followers" },
    DIRECT: { variant: "secondary", text: "Direct" },
  };
  return badges[visibility] || { variant: "secondary", text: visibility };
};

export default function ActivityCard({ activity }) {
  const visibilityBadge = getVisibilityBadge(activity.visibility);
  const typeColor = getActivityTypeColor(activity.type);

  // Format date
  const formattedDate = activity.published_at
    ? new Date(activity.published_at).toLocaleString()
    : "Unknown date";

  return (
    <Card
      className="shadow-sm border-0 mb-3"
      style={{ maxWidth: "800px", width: "100%" }}
    >
      <Card.Body>
        <Row className="align-items-start">
          <Col>
            {/* Header: Type and Visibility */}
            <div className="d-flex gap-2 mb-2">
              <Badge bg={typeColor}>{activity.type}</Badge>
              <Badge bg={visibilityBadge.variant}>{visibilityBadge.text}</Badge>
              {activity.community_id && (
                <Badge bg="light" text="dark">
                  Community: {activity.community_id}
                </Badge>
              )}
            </div>

            {/* Summary */}
            {activity.summary && (
              <Card.Text className="mb-2 fw-semibold">{activity.summary}</Card.Text>
            )}

            {/* Actor and Object info */}
            <div className="small text-muted">
              <div>
                <strong>Actor:</strong>{" "}
                <code>{activity.actor_id || activity.as2_json?.actor || "N/A"}</code>
              </div>
              <div>
                <strong>Object:</strong>{" "}
                <code>
                  {activity.object_type || activity.as2_json?.object?.type || "N/A"} #{" "}
                  {activity.object_id || activity.as2_json?.object?.id || "N/A"}
                </code>
              </div>
              <div>
                <strong>Published:</strong> {formattedDate}
              </div>
              <div>
                <strong>Event ID:</strong> {activity.id}
              </div>
            </div>

            {/* AS2 JSON preview (optional, for debugging) */}
            {activity.as2_json && Object.keys(activity.as2_json).length > 0 && (
              <details className="mt-2">
                <summary className="small text-muted" style={{ cursor: "pointer" }}>
                  View AS2 JSON
                </summary>
                <pre
                  className="bg-light p-2 rounded mt-2 small"
                  style={{
                    maxHeight: "200px",
                    overflow: "auto",
                    fontSize: "0.75rem",
                  }}
                >
                  {JSON.stringify(activity.as2_json, null, 2)}
                </pre>
              </details>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
