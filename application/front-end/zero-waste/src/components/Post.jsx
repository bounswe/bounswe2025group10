// src/components/Post.jsx
import React, { useState } from "react";
import { Card, Button } from "react-bootstrap";
import { useAuth } from "../Login/AuthContent"; // adjust path if needed

export default function Post({ post }) {
  const { apiUrl, token } = useAuth();   // comment out if not needed
  const [liked, setLiked] = useState(post.liked || false);
  const [likes, setLikes] = useState(post.like_count || 0);
  const [isSaving, setIsSaving] = useState(false);

  /* ─────────── Like / Unlike toggle (optional) ─────────── */
  const toggleLike = async () => {
    if (!token) return;      // skip if anonymous
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
        setLikes(liked ? likes - 1 : likes + 1);
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
        <Card.Img
          variant="top"
          src={post.image}
          alt={post.title || "post image"}
          style={{ objectFit: "cover", maxHeight: 400 }}
        />
      )}

      <Card.Body>
        {post.title && <Card.Title>{post.title}</Card.Title>}
        <Card.Text>{post.description}</Card.Text>

        <div className="d-flex align-items-center">
          <Button
            variant={liked ? "primary" : "outline-primary"}
            size="sm"
            disabled={isSaving}
            onClick={toggleLike}
          >
            {liked ? "Liked" : "Like"}
          </Button>
          <span className="ms-2 text-muted">{likes}</span>
        </div>
      </Card.Body>
    </Card>
  );
}