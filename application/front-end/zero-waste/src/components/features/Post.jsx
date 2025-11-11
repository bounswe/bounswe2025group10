import React, { useState } from "react";
import { Card, Button, Spinner } from "react-bootstrap";
import { useAuth } from "../Login/AuthContent";

export default function Post({ post, onToggleLike }) {
  const { apiUrl, token } = useAuth();
  const [liked, setLiked] = useState(post.liked || false);
  const [likes, setLikes] = useState(post.like_count || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleLike = async () => {
    if (!token) return;
    if (onToggleLike) {
      onToggleLike(post.id); // delegate to parent if mock
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/posts/${post.id}/like/`, {
        method: liked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setLiked(!liked);
        setLikes((prev) => (liked ? prev - 1 : prev + 1));
      } else {
        console.error("Like toggle failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-4 shadow-sm">
      {post.image && (
        <div style={{ position: "relative", maxHeight: 400 }}>
          <Card.Img
            variant="top"
            src={post.image}
            alt={post.title || "Post image"}
            onLoad={() => setImgLoaded(true)}
            style={{
              objectFit: "cover",
              maxHeight: 400,
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          />
          {!imgLoaded && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: 400,
                width: "100%",
                backgroundColor: "#f0f0f0",
              }}
            >
              <Spinner animation="border" variant="secondary" />
            </div>
          )}
        </div>
      )}

      <Card.Body>
        {post.title && <Card.Title>{post.title}</Card.Title>}
        <Card.Text>{post.description}</Card.Text>

        <div className="d-flex align-items-center">
          <Button
            variant={liked ? "primary" : "outline-primary"}
            size="sm"
            disabled={isSaving}
            onClick={handleLike}
          >
            {liked ? "Liked" : "Like"}
          </Button>
          <span className="ms-2 text-muted">{likes}</span>
        </div>
      </Card.Body>
    </Card>
  );
}
