import React, { useEffect, useState, useRef } from "react";
import { Spinner, Button, Form, Card, Image, Row, Col } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Post from "../components/Post";
import { useAuth } from "../Login/AuthContent";
import { showToast } from "../util/toast";

export default function ProfilePage() {
  /* ─────────── Context / state */
  const { token,logout } = useAuth();          // make sure AuthContext provides `username`
  const {username}=useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [profile, setProfile]       = useState(null);     // { username, bio, avatar }
  const [bioDraft, setBioDraft]     = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);   // true ⇢ fallback picture

  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState(null);

  const [posts, setPosts]               = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const fileInputRef = useRef(null);

  /* ────────────────────────────────── 1.  Load BIO + AVATAR */
  useEffect(() => {
    if (!token || !username) return;
  
    const fetchProfile = async () => {
      try {
        /* ---- bio ---- */
        const resBio = await fetch(`${apiUrl}/api/profile/${username}/bio/`);
        if (!resBio.ok) throw new Error("bio");
        const { bio } = await resBio.json();
  
        /* ---- avatar ---- */
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3-second delay
        const avatarUrl = `${apiUrl}/api/profile/${username}/picture/?t=${Date.now()}`; // bust cache
  
        setProfile({ username, bio, avatar: avatarUrl });
        setAvatarError(false); // reset error
        setBioDraft(bio);
      } catch (err) {
        showToast("Could not load profile", "error");
      }
    };
  
    fetchProfile();
  }, [apiUrl, token, username, avatarLoaded]);

  /* ────────────────────────────────── 2.  Load POSTS */
  useEffect(() => {
    if (!token) return;

    const getPostData = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/posts/user/`, {
          headers: { Authorization: `Bearer ${token}` },   // no body ⇒ no Content-Type
        });
        if (!res.ok) throw new Error("posts");

        // backend returns { data: [...] }
        const { data } = await res.json();
        setPosts(data);
      } catch (err) {
        showToast("Could not load posts", "error");
      } finally {
        setLoadingPosts(false);
      }
    };

    getPostData();
  }, [apiUrl, token]);

  /* ────────────────────────────────── 3.  Save  */
  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    setSaveError(null);

    try {
      /* ---- Update bio (PUT /bio/) ---- */
      if (bioDraft !== profile.bio) {
        const res = await fetch(
          `${apiUrl}/api/profile/${username}/bio/`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ bio: bioDraft }),
          }
        );
        if (!res.ok) throw new Error("bio");
        const { bio } = await res.json();
        setProfile((p) => ({ ...p, bio }));
      }

      /* ---- Upload avatar (POST /profile-picture/) ---- */
      if (avatarFile) {
        const form = new FormData();
        form.append("image", avatarFile);                 // field **image**

        const res = await fetch(`${apiUrl}/api/profile/profile-picture/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }, // DO NOT set Content-Type manually
          body: form,
        });
        if (!res.ok) throw new Error("avatar");

        const { url } = await res.json();                 // returns { url: "/media/..." }
        // bust browser cache by appending a random query string
        setAvatarLoaded(false);
        const avatarUrl = apiUrl.replace(/\/$/, "") + url + `?t=${Date.now()}`;

        setProfile((p) => ({ ...p, avatar: avatarUrl }));
        setAvatarFile(null);
        setAvatarLoaded(false);
        setAvatarError(false);            // new upload ⇒ try loading again
      }

      showToast("Profile updated", "success");
    } catch (err) {
      setSaveError("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  /* ────────────────────────────────── 4.  UI */
  if (!profile) {
    return (
      <div className="d-flex justify-content-center pt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  const avatarSrc = avatarFile
  ? URL.createObjectURL(avatarFile)
  : avatarError
    ? `https://i.pravatar.cc/128?u=${username}`  // fallback to internet avatar
    : profile.avatar;

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Profile" />

      <main className="container mx-auto px-4 py-4 flex-grow-1">

        {/* ───── Profile  */}
        <Card className="shadow-sm mb-4">
          <Card.Body className="d-flex align-items-center">
            {/* avatar picker */}
            <input
              type="file"
              accept="image/png, image/jpeg"
              ref={fileInputRef}
              className="d-none"
              onChange={(e) => e.target.files[0] && setAvatarFile(e.target.files[0])}
            />
            <div
              style={{ position: "relative", width: 128, height: 128, marginRight: 16 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Image
                roundedCircle
                src={avatarSrc}
                key={avatarSrc}
                alt="avatar"
                width={128}
                height={128}
                onLoad={() => setAvatarLoaded(true)}
                onError={() => setAvatarError(true)}
                style={{
                  position: "absolute",
                  top: 0, left: 0,
                  objectFit: "cover",
                  cursor: "pointer",
                  opacity: avatarLoaded ? 1 : 0,
                  transition: "opacity 0.3s",
                }}
              />
              {!avatarLoaded && (
                <div
                  style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: 128, height: 128,
                    borderRadius: "50%",
                    backgroundColor: "#e0e0e0",
                  }}
                />
              )}
            </div>

            {/* bio + buttons */}
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="mb-0">{profile.username}</h3>
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
                <Button variant="success" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setBioDraft(profile.bio);
                    setAvatarFile(null);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ───── Posts  */}
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
      </main>
    </div>
  );
}