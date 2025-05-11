// src/profile/ProfilePage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../Login/AuthContent";
import Post from "../components/Post";
import Navbar from "../components/Navbar";
import {
  Spinner,
  Alert,
  Button,
  Form,
  Card,
  Image,
  Row,
  Col,
} from "react-bootstrap";

export default function ProfilePage() {
  const { token,logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bioDraft, setBioDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);              // 🆕
  const fileInputRef = useRef(null);                               // 🆕

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL;

  /* ────────────────────────────────────────── PROFILE  (mock) */
  useEffect(() => {
    const mockProfile = {
      first_name: "Başar",
      last_name: "Temiz",
      avatar: "https://picsum.photos/seed/profile/200",
      bio: "Computer-engineering undergrad on a zero-waste journey 🌱♻️",
    };
    setProfile(mockProfile);
    setBioDraft(mockProfile.bio);
  }, []);

  /* ────────────────────────────────────────── POSTS  (mock) */
  useEffect(() => {
    const mockPosts = [
      {
        id: 1,
        title: "Composting 101",
        description:
          "A beginner-friendly guide on turning kitchen scraps into nutrient-rich soil.",
        image: "https://picsum.photos/seed/compost/600/300",
        like_count: 12,
        liked: false,
      },
      {
        id: 2,
        title: "DIY Beeswax Wraps",
        description:
          "Step-by-step tutorial on making reusable food wraps to replace single-use plastic.",
        image: null,
        like_count: 7,
        liked: true,
      },
      {
        id: 3,
        title: "Up-cycled Planters",
        description:
          "Turn old cans and jars into stylish planters for your indoor garden.",
        image: "https://picsum.photos/seed/planter/600/300",
        like_count: 4,
        liked: false,
      },
    ];
    setPosts(mockPosts);
    setLoadingPosts(false);
  }, []);

  /* ────────────────────────────────────────── Save BIO / AVATAR */
  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError(null);

    // --- offline / mock mode: update local state only ------------
    if (!apiUrl) {
      setProfile((p) => ({
        ...p,
        bio: bioDraft,
        avatar: avatarFile ? URL.createObjectURL(avatarFile) : p.avatar,
      }));
      setAvatarFile(null);
      setSaving(false);
      return;
    }

    try {
      const form = new FormData();
      form.append("bio", bioDraft);
      if (avatarFile) form.append("avatar", avatarFile);

      const res = await fetch(`${apiUrl}/api/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      if (!res.ok) throw new Error("Couldn’t save profile");
      const updated = await res.json();
      setProfile(updated);
      setAvatarFile(null);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ────────────────────────────────────────── UI */
  if (!profile) {
    return (
      <div className="d-flex justify-content-center pt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
    <Navbar active="Main Page" />
    <div className="container py-4">
    
      {/* ── PROFILE CARD ─────────────────────── */}
      <Card className="mb-4 shadow-sm">
        <Card.Body className="d-flex align-items-center">
          {/* Avatar upload */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="d-none"
            onChange={(e) => {
              if (e.target.files[0]) setAvatarFile(e.target.files[0]);
            }}
          />
          <Image
            roundedCircle
            src={
              avatarFile
                ? URL.createObjectURL(avatarFile)
                : profile.avatar || "/placeholder-avatar.png"
            }
            alt="profile"
            width={128}
            height={128}
            className="me-4 object-fit-cover"
            style={{ cursor: "pointer" }}
            onClick={() => fileInputRef.current?.click()}
          />

          <div className="flex-grow-1">
            <h3 className="mb-1">
              {profile.first_name} {profile.last_name}
            </h3>

            <Form.Group controlId="bioTextarea">
              <Form.Control
                as="textarea"
                rows={3}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
              />
            </Form.Group>

            {saveError && <Alert variant="danger">{saveError}</Alert>}

            <div className="mt-2 d-flex gap-2">
              <Button
                variant="success"
                disabled={saving}
                onClick={handleSaveProfile}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="secondary"
                disabled={!avatarFile && bioDraft === profile.bio}
                onClick={() => {
                  setAvatarFile(null);
                  setBioDraft(profile.bio);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ── POSTS LIST (narrow column) ──────── */}
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <h4 className="mb-3">My Posts</h4>
          {loadingPosts ? (
            <Spinner animation="border" />
          ) : posts.length === 0 ? (
            <p className="text-muted">No posts yet.</p>
          ) : (
            posts.map((p) => <Post key={p.id} post={p} />)
          )}
        </Col>
      </Row>
    </div>
    <footer className="py-3 border-top text-center">
        <div className="footer-box">
          <button className="btn btn-outline-dark btn-sm ms-3" onClick={logout}>
            Log out
          </button>
        </div>
      </footer>
    </>
  );
}