import React from "react";
import { Card, Button } from "react-bootstrap";

const PostCard = ({ image, title, description, onDelete }) => {
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