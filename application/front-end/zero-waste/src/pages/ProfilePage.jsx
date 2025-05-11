import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../Login/AuthContent";
import Post from "../components/Post";
import Navbar from "../components/Navbar";
import { showToast } from "../util/toast";
import { Spinner, Button, Form, Card, Image, Row, Col } from "react-bootstrap";

export default function ProfilePage() {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bioDraft, setBioDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const fileInputRef = useRef(null);

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
        description: "A beginner-friendly guide on turning kitchen scraps into nutrient-rich soil.",
        image: "https://picsum.photos/seed/compost/600/300",
        like_count: 12,
        liked: false,
      },
      {
        id: 2,
        title: "DIY Beeswax Wraps",
        description: "Step-by-step tutorial on making reusable food wraps to replace single-use plastic.",
        image: null,
        like_count: 7,
        liked: true,
      },
      {
        id: 3,
        title: "Up-cycled Planters",
        description: "Turn old cans and jars into stylish planters for your indoor garden.",
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
            // ⚠️ DO NOT set Content-Type here — browser will do it
          },
          body: form,
          
        });

        if (!res.ok) {
          showToast("Profile could not be saved", "error", 1500);
          return;
        }
      
        const updated = await res.json();
        setProfile(updated);
        setAvatarFile(null);
      } catch (err) {
        showToast("Something went wrong", "error", 1500);
      } finally {
        setSaving(false);
      }
    }
    

  /* ────────────────────────────────────────── UI */
  if (!profile) {
    return (
      <div className="d-flex justify-content-center pt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  const avatarSrc = avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar;

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Profile" />
      <main className="container mx-auto px-4 py-8 flex-grow-1">
        {/* Profile Section */}
        <section className="mb-8">
          <Card className="shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="d-none"
                onChange={(e) => {
                  if (e.target.files[0]) setAvatarFile(e.target.files[0]);
                }}
              />
              <div
                style={{
                  position: "relative",
                  width: 128,
                  height: 128,
                  marginRight: "1rem",
                  flexShrink: 0,
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Image
                  roundedCircle
                  src={avatarSrc}
                  alt="profile"
                  width={128}
                  height={128}
                  onLoad={() => setAvatarLoaded(true)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    objectFit: "cover",
                    cursor: "pointer",
                    opacity: avatarLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease-in-out",
                  }}
                />
                {!avatarLoaded && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 128,
                      height: 128,
                      borderRadius: "50%",
                      backgroundColor: "#e0e0e0",
                    }}
                  />
                )}
              </div>

              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="mb-0">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <Button variant="outline-dark" size="sm" onClick={logout}>
                    Log out
                  </Button>
                </div>
                <Form.Group controlId="bioTextarea">
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="Write something about yourself..."
                  />
                </Form.Group>
                {saveError && <div className="text-danger mt-2">{saveError}</div>}
                <div className="mt-2 d-flex gap-2">
                  <Button
                    variant="success"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setBioDraft(profile.bio)}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Posts Section */}
        <section>
          <h4 className="mb-3">My Posts</h4>
          {loadingPosts ? (
            <Spinner animation="border" />
          ) : posts.length === 0 ? (
            <p className="text-muted">No posts yet.</p>
          ) : (
            <Row className="g-4">
              {posts.map((post) => (
                <Col key={post.id} md={6} lg={4}>
                  <Post post={post} />
                </Col>
              ))}
            </Row>
          )}
        </section>
      </main>
    </div>
  );
}
