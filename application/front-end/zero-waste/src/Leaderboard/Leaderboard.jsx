import React, { useState, useEffect } from "react";
import { useAuth } from "../Login/AuthContent";
import Navbar from "../components/Navbar";
import axios from "axios";

const DEFAULT_PROFILE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";

export default function LeaderboardPage() {
  const { logout, token } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBioModal, setShowBioModal] = useState(false);
  const [selectedUserBio, setSelectedUserBio] = useState(null);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch leaderboard data
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/waste/leaderboard/`, {
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {}
        });
        
        const { top_users, current_user } = response.data.data;
        
        // Process top 10 data
        const leaderboardWithPictures = await Promise.all(
          top_users.map(async (userData, index) => {
            let profileImage = null;
            
            try {
              if (userData.profile_picture) {
                // Check if profile_picture is a full URL or a relative path
                if (userData.profile_picture.startsWith('http')) {
                  profileImage = userData.profile_picture;
                } else {
                  // If it's a relative path, fetch from API
                  const pictureResponse = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/profile/${userData.username}/picture/`,
                    {
                      headers: {
                        'Content-Type': 'image/jpeg'
                      },
                      responseType: 'blob'
                    }
                  );
                  profileImage = URL.createObjectURL(pictureResponse.data);
                }
              } else {
                profileImage = DEFAULT_PROFILE_IMAGE;
              }
            } catch (error) {
              console.error(`Failed to fetch profile picture for ${userData.username}:`, error);
              profileImage = DEFAULT_PROFILE_IMAGE;
            }
            
            return {
              username: userData.username,
              score: userData.total_waste,
              points: Math.round(userData.points || 0), // Round points to integer
              profileImage: profileImage,
              rank: userData.rank,
              isCurrentUser: current_user && userData.username === current_user.username
            };
          })
        );
        
        setLeaderboard(leaderboardWithPictures);
        
        // Set user's rank info if current user exists and not in top 10
        if (current_user && current_user.rank > 10) {
          // Fetch profile picture for current user
          let currentUserImage = null;
          try {
            if (current_user.profile_picture) {
              // Check if profile_picture is a full URL or a relative path
              if (current_user.profile_picture.startsWith('http')) {
                currentUserImage = current_user.profile_picture;
              } else {
                // If it's a relative path, fetch from API
                const pictureResponse = await axios.get(
                  `${import.meta.env.VITE_API_URL}/api/profile/${current_user.username}/picture/`,
                  {
                    headers: {
                      'Content-Type': 'image/jpeg'
                    },
                    responseType: 'blob'
                  }
                );
                currentUserImage = URL.createObjectURL(pictureResponse.data);
              }
            } else {
              currentUserImage = DEFAULT_PROFILE_IMAGE;
            }
          } catch (error) {
            console.error(`Failed to fetch profile picture for current user:`, error);
            currentUserImage = DEFAULT_PROFILE_IMAGE;
          }
          
          setUserRank({
            position: current_user.rank,
            username: current_user.username,
            score: current_user.total_waste,
            points: Math.round(current_user.points || 0), // Round points to integer
            profileImage: currentUserImage
          });
        } else {
          setUserRank(null);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token]); // Only token in dependency

  const fetchUserBio = async (username) => {
    setBioLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile/${username}/bio/`);
      setSelectedUserBio(response.data);
      setShowBioModal(true);
    } catch (error) {
      console.error(`Failed to fetch bio for ${username}:`, error);
      setSelectedUserBio({ username, bio: "Bio could not be loaded." });
      setShowBioModal(true);
    } finally {
      setBioLoading(false);
    }
  };

  const handleProfileClick = (username) => {
    fetchUserBio(username);
  };

  const getRankDisplay = (position) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return position;
  };

  const getUserRowStyle = (isCurrentUser, index) => {
    let baseStyle = {};
    
    // Medal colors for top 3
    if (index === 0) {
      baseStyle = { backgroundColor: '#FFD700' }; // Gold
    } else if (index === 1) {
      baseStyle = { backgroundColor: '#C0C0C0' }; // Silver
    } else if (index === 2) {
      baseStyle = { backgroundColor: '#CD7F32' }; // Bronze
    } else if (index % 2 !== 0) {
      baseStyle = { backgroundColor: '#f1f3f5' };
    } else {
      baseStyle = { backgroundColor: 'white' };
    }
    
    // Add blue border for current user
    if (isCurrentUser) {
      return {
        ...baseStyle,
        border: '2px solid #0d6efd',
        borderRadius: '8px'
      };
    }
    
    return baseStyle;
  };

  return (
    <>
      <Navbar />

      <div
        className="container py-5"
        style={{
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h2
          className="mb-4 text-center fw-semibold"
          style={{ color: "#2c3e50" }}
        >
          🌿 Top 10 Zero Waste Champions
        </h2>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <div
            className="table-responsive border border-success rounded"
            style={{ borderWidth: "2px !important" }}
          >
            <table
              className="table table-bordered align-middle text-center mb-0"
              style={{
                backgroundColor: "white",
                borderCollapse: "separate",
                borderSpacing: "0",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead className="table-light">
                <tr>
                  <th className="fw-bold text-center">#</th>
                  <th className="fw-bold text-center">Profile</th>
                  <th className="fw-bold text-center">Username</th>
                  <th className="fw-bold text-center">Avoided CO2 emissions</th>
                  <th className="fw-bold text-center">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((u, index) => {
                  return (
                    <tr
                      key={u.username}
                      className={
                        u.isCurrentUser
                          ? "fw-bold"
                          : index <= 2 // Top 3 users (index 0, 1, 2) will be bold
                          ? "fw-bold"
                          : index % 2 !== 0
                          ? "table-light"
                          : ""
                      }
                      style={getUserRowStyle(u.isCurrentUser, index)}
                    >
                      <td
                        style={{
                          fontSize:
                            u.rank === 1 || u.rank === 2 || u.rank === 3
                              ? "1.5rem"
                              : "1rem",
                        }}
                      >
                        {getRankDisplay(u.rank)}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center">
                          <img
                            src={u.profileImage}
                            alt={u.username}
                            className="rounded-circle border border-secondary"
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              cursor: "pointer"
                            }}
                            onClick={() => handleProfileClick(u.username)}
                            title={`Click to view ${u.username}'s bio`}
                          />
                        </div>
                      </td>
                      <td>{u.username}</td>
                      <td>{u.score}</td>
                      <td>{u.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Show current user's rank if not in top 10 */}
        {userRank && !loading && !error && (
          <div className="mt-4">
            <h4 className="text-center mb-3">Your Ranking</h4>
            <div
              className="table-responsive border border-primary rounded"
              style={{ borderWidth: "2px !important" }}
            >
              <table
                className="table table-bordered align-middle text-center mb-0"
                style={{
                  backgroundColor: "white",
                  borderCollapse: "separate",
                  borderSpacing: "0",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold text-center">#</th>
                    <th className="fw-bold text-center">Profile</th>
                    <th className="fw-bold text-center">Username</th>
                    <th className="fw-bold text-center">Avoided CO2 emissions</th>
                    <th className="fw-bold text-center">Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className="fw-bold"
                    style={{
                      backgroundColor:
                        userRank.position === 1
                          ? "#FFD700"
                          : userRank.position === 2
                          ? "#C0C0C0"
                          : userRank.position === 3
                          ? "#CD7F32"
                          : "#e7f3ff",
                      border: "2px solid #0d6efd",
                      borderRadius: "8px",
                    }}
                  >
                    <td
                      style={{
                        fontSize: userRank.position <= 3 ? "1.5rem" : "1rem",
                      }}
                    >
                      {getRankDisplay(userRank.position)}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center">
                        <img
                          src={userRank.profileImage}
                          alt={userRank.username}
                          className="rounded-circle border border-secondary"
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            cursor: "pointer"
                          }}
                          onClick={() => handleProfileClick(userRank.username)}
                          title={`Click to view ${userRank.username}'s bio`}
                        />
                      </div>
                    </td>
                    <td>{userRank.username}</td>
                    <td>{userRank.score}</td>
                    <td>{userRank.points}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bio Modal */}
        {showBioModal && (
          <div 
            className="modal fade show" 
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowBioModal(false)}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ border: 'none', borderRadius: '16px', overflow: 'hidden' }}>
                <div className="position-relative" style={{ background: 'linear-gradient(135deg, #28a745 0%, #155724 100%)', padding: '2rem', color: 'white' }}>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white position-absolute top-0 end-0" 
                    style={{ margin: '1rem' }}
                    onClick={() => setShowBioModal(false)}
                  ></button>
                  
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <img
                        src={leaderboard.find(u => u.username === selectedUserBio?.username)?.profileImage || 
                             (userRank && userRank.username === selectedUserBio?.username ? userRank.profileImage : DEFAULT_PROFILE_IMAGE)}
                        alt={selectedUserBio?.username}
                        className="rounded-circle border border-3 border-white shadow"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div className="text-start">
                      <h4 className="fw-bold mb-1">{selectedUserBio?.username}</h4>
                      <p className="opacity-75 mb-0">Profile Bio</p>
                    </div>
                  </div>
                </div>
                
                <div className="modal-body" style={{ padding: '2rem' }}>
                  {bioLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading bio...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading bio...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div 
                        className="p-4 rounded-3" 
                        style={{ 
                          backgroundColor: '#f8f9fa',
                          border: '1px dashed #dee2e6',
                          minHeight: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <p className="mb-0" style={{ 
                          fontSize: '1.1rem', 
                          lineHeight: '1.6',
                          color: selectedUserBio?.bio ? '#333' : '#6c757d',
                          fontStyle: selectedUserBio?.bio ? 'normal' : 'italic'
                        }}>
                          {selectedUserBio?.bio || "This user hasn't written a bio yet."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="py-3 border-top border-secondary text-center">
          <div
            className="d-inline-block p-3 bg-white text-dark rounded text-center"
            style={{ border: "1px solid #dee2e6" }}
          >
            <button className="btn btn-outline-dark btn-sm" onClick={logout}>
              Log out
            </button>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @media (max-width: 576px) {
          .container {
            padding: 1rem !important;
          }

          h2 {
            font-size: 1.5rem !important;
          }

          .table th,
          .table td {
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </>
  );
}