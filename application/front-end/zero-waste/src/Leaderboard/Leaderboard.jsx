import React, { useState, useEffect } from "react";
import { useAuth } from "../Login/AuthContent";
import Navbar from "../components/Navbar";
import axios from "axios";

export default function LeaderboardPage() {
  const { logout, token } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current user info first
        let currentUserData = null;
        if (token) {
          try {
            const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/me/`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            currentUserData = userResponse.data;
          } catch (error) {
            console.error("Failed to fetch current user:", error);
          }
        }
        
        // Fetch complete leaderboard data
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/waste/leaderboard/`);
        const leaderboardData = response.data.data;
        
        // Find current user's position
        const currentUserIndex = currentUserData 
          ? leaderboardData.findIndex(userData => userData.username === currentUserData.username)
          : -1;
        
        // Take top 10 for display
        const top10Data = leaderboardData.slice(0, 10);
        
        // Process top 10 data
        const leaderboardWithPictures = await Promise.all(
          top10Data.map(async (userData, index) => {
            let profileImage = null;
            
            try {
              if (userData.profile_picture) {
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
              } else {
                profileImage = `https://i.pravatar.cc/100?img=${index + 1}`;
              }
            } catch (error) {
              console.error(`Failed to fetch profile picture for ${userData.username}:`, error);
              profileImage = `https://i.pravatar.cc/100?img=${index + 1}`;
            }
            
            return {
              username: userData.username,
              score: userData.total_waste,
              points: Math.round(userData.points || 0), // Round points to integer
              profileImage: profileImage,
              isCurrentUser: currentUserData && userData.username === currentUserData.username
            };
          })
        );
        
        setLeaderboard(leaderboardWithPictures);
        
        // Set user's rank info if not in top 10
        if (currentUserIndex !== -1 && currentUserIndex >= 10) {
          const currentUserEntryData = leaderboardData[currentUserIndex];
          
          // Fetch profile picture for current user
          let currentUserImage = null;
          try {
            if (currentUserEntryData.profile_picture) {
              const pictureResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/profile/${currentUserEntryData.username}/picture/`,
                {
                  headers: {
                    'Content-Type': 'image/jpeg'
                  },
                  responseType: 'blob'
                }
              );
              currentUserImage = URL.createObjectURL(pictureResponse.data);
            } else {
              currentUserImage = `https://i.pravatar.cc/100?img=${currentUserIndex + 1}`;
            }
          } catch (error) {
            console.error(`Failed to fetch profile picture for current user:`, error);
            currentUserImage = `https://i.pravatar.cc/100?img=${currentUserIndex + 1}`;
          }
          
          setUserRank({
            position: currentUserIndex + 1,
            username: currentUserEntryData.username,
            score: currentUserEntryData.total_waste,
            points: Math.round(currentUserEntryData.points || 0), // Round points to integer
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
                  const position = index + 1;
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
                            position === 1 || position === 2 || position === 3
                              ? "1.5rem"
                              : "1rem",
                        }}
                      >
                        {getRankDisplay(position)}
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
                            }}
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
                          }}
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