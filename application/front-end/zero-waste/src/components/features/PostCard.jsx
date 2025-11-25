import React from "react";
import { Card, Button } from "react-bootstrap";

/**
 * PostCard
 * --------
 * Props:
 *  • image           : string (image URL)
 *  • title           : string (post title or report reason)
 *  • description     : string (post content)
 *  • reportReason    : string (report reason - optional)
 *  • reportDescription : string (report description - optional)
 *  • onDelete        : function (delete callback)
 */

const PostCard = ({ image, title, description, reportReason, reportDescription, onDelete }) => {
  return (
    <Card className="shadow-sm border-0 mb-4" style={{ maxWidth: "600px" }}>
      {image && (
        <Card.Img
          variant="top"
          src={image}
          alt="Post"
          style={{ objectFit: "cover", height: "250px" }}
        />
      )}
      <Card.Body>
        <Card.Title className="text-success fw-semibold">{title}</Card.Title>
        <Card.Text className="text-muted">{description}</Card.Text>

        {/* Report information */}
        {reportReason && (
          <div className="mt-2">
            <strong className="text-danger">Report Reason:</strong> {reportReason}
          </div>
        )}
        {reportDescription && (
          <div className="text-muted small mt-1">
            <strong>Report Description:</strong> {reportDescription}
          </div>
        )}

        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            className="mt-2"
          >
            Delete
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default PostCard;