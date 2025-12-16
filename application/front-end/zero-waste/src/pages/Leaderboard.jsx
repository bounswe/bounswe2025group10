import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import { useApi } from "../hooks/useApi";
import { leaderboardService } from "../services/leaderboardService";

const DEFAULT_PROFILE_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";

export default function LeaderboardPage() {
  const { logout, token } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    data: leaderboardData,
    loading,
    error,
    execute: refetchLeaderboard,
  } = useApi(() => leaderboardService.getLeaderboard(token), {
    initialData: { leaderboard: [], userRank: null },
    showErrorToast: true,
    errorMessage: "Failed to fetch leaderboard",
  });

  const leaderboard = leaderboardData?.leaderboard || [];
  const userRank = leaderboardData?.userRank || null;

  useEffect(() => {
    refetchLeaderboard();
  }, []);

  const handleProfileClick = (username) => {
    navigate(`/profile/${username}`);
  };

  const getRankDisplay = (position) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return position;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <h2
        className="mb-6 text-2xl sm:text-3xl font-bold text-center"
        style={{ color: currentTheme.text }}
      >
        {t("leaderboard.title", "🌿 Top 10 Zero Waste Champions")}
      </h2>

      {loading ? (
        <div className="text-center py-8">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: currentTheme.secondary }}
          ></div>
          <p
            className="mt-2"
            style={{ color: currentTheme.text, opacity: 0.7 }}
          >
            {t("common.loading", "Loading...")}
          </p>
        </div>
      ) : error ? (
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: currentTheme.hover,
            borderColor: currentTheme.border,
            color: currentTheme.text,
          }}
        >
          {error}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div
            className="hidden md:block overflow-x-auto rounded-lg border"
            style={{ borderColor: currentTheme.border }}
          >
            <table
              className="w-full text-center"
              style={{
                backgroundColor: currentTheme.background,
                borderCollapse: "separate",
                borderSpacing: "0",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: currentTheme.hover }}>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    #
                  </th>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    {t("leaderboard.profile", "Profile")}
                  </th>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    {t("leaderboard.username", "Username")}
                  </th>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    {t("leaderboard.co2", "Avoided CO2 emissions")} (kg)
                  </th>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    {t("leaderboard.points", "Points")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((u, index) => {
                  return (
                    <tr
                      key={u.username}
                      className={
                        u.isCurrentUser
                          ? "font-bold"
                          : index <= 2
                          ? "font-bold"
                          : ""
                      }
                      style={{
                        backgroundColor: u.isCurrentUser
                          ? currentTheme.secondary + "20"
                          : index % 2 === 0
                          ? currentTheme.background
                          : currentTheme.hover,
                        borderTop: `1px solid ${currentTheme.border}`,
                        color: currentTheme.text,
                      }}
                    >
                      <td
                        className="p-3"
                        style={{
                          fontSize:
                            u.rank === 1 || u.rank === 2 || u.rank === 3
                              ? "1.5rem"
                              : "1rem",
                        }}
                      >
                        {getRankDisplay(u.rank)}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center">
                          <img
                            src={u.profileImage}
                            alt={u.username}
                            className="rounded-full border"
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              cursor: "pointer",
                              borderColor: currentTheme.border,
                            }}
                            onClick={() => handleProfileClick(u.username)}
                            title={`Click to view ${u.username}'s bio`}
                          />
                        </div>
                      </td>
                      <td className="p-3">{u.username}</td>
                      <td className="p-3">{(u.score / 1000).toFixed(2)}</td>
                      <td className="p-3">{u.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {leaderboard.map((u, index) => (
              <div
                key={u.username}
                className="rounded-xl border p-4 shadow-sm flex items-center gap-4"
                style={{
                  backgroundColor: u.isCurrentUser
                    ? currentTheme.secondary + "10"
                    : currentTheme.background,
                  borderColor: u.isCurrentUser
                    ? currentTheme.secondary
                    : currentTheme.border,
                  color: currentTheme.text,
                }}
              >
                <div className="flex-shrink-0 text-2xl font-bold w-8 text-center">
                  {getRankDisplay(u.rank)}
                </div>

                <div className="flex-shrink-0">
                  <img
                    src={u.profileImage}
                    alt={u.username}
                    className="rounded-full border"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      cursor: "pointer",
                      borderColor: currentTheme.border,
                    }}
                    onClick={() => handleProfileClick(u.username)}
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <h3
                    className="font-bold text-lg truncate"
                    onClick={() => handleProfileClick(u.username)}
                  >
                    {u.username}
                  </h3>
                  <div className="flex flex-col text-sm opacity-80">
                    <div className="flex justify-between">
                      <span>{t("leaderboard.points", "Points")}:</span>
                      <span className="font-medium">{u.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CO2 (kg):</span>
                      <span className="font-medium">
                        {(u.score / 1000).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Show current user's rank if not in top 10 */}
      {userRank && !loading && !error && (
        <div className="mt-6">
          <h4
            className="text-center text-xl font-bold mb-4"
            style={{ color: currentTheme.text }}
          >
            {t("leaderboard.yourRanking", "Your Ranking")}
          </h4>
          {/* Desktop Table View */}
          <div
            className="hidden md:block overflow-x-auto rounded-lg border"
            style={{ borderColor: currentTheme.secondary }}
          >
            <table
              className="w-full text-center"
              style={{
                backgroundColor: currentTheme.background,
                borderCollapse: "separate",
                borderSpacing: "0",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: currentTheme.hover }}>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    #
                  </th>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    {t("leaderboard.profile", "Profile")}
                  </th>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    {t("leaderboard.username", "Username")}
                  </th>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    {t("leaderboard.co2", "Avoided CO2 emissions")} (kg)
                  </th>
                  <th
                    className="font-bold text-center p-3"
                    style={{ color: currentTheme.text }}
                  >
                    {t("leaderboard.points", "Points")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className="font-bold"
                  style={{
                    backgroundColor: currentTheme.secondary + "30",
                    borderTop: `2px solid ${currentTheme.secondary}`,
                    color: currentTheme.text,
                  }}
                >
                  <td
                    className="p-3"
                    style={{
                      fontSize: userRank.position <= 3 ? "1.5rem" : "1rem",
                    }}
                  >
                    {getRankDisplay(userRank.position)}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center">
                      <img
                        src={userRank.profileImage}
                        alt={userRank.username}
                        className="rounded-full border"
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          cursor: "pointer",
                          borderColor: currentTheme.border,
                        }}
                        onClick={() => handleProfileClick(userRank.username)}
                        title={`Click to view ${userRank.username}'s bio`}
                      />
                    </div>
                  </td>
                  <td className="p-3">{userRank.username}</td>
                  <td className="p-3">{(userRank.score / 1000).toFixed(2)}</td>
                  <td className="p-3">{userRank.points}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <div
              className="rounded-xl border p-4 shadow-sm flex items-center gap-4"
              style={{
                backgroundColor: currentTheme.secondary + "20",
                borderColor: currentTheme.secondary,
                color: currentTheme.text,
              }}
            >
              <div className="flex-shrink-0 text-2xl font-bold w-8 text-center">
                {getRankDisplay(userRank.position)}
              </div>

              <div className="flex-shrink-0">
                <img
                  src={userRank.profileImage}
                  alt={userRank.username}
                  className="rounded-full border"
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    cursor: "pointer",
                    borderColor: currentTheme.border,
                  }}
                  onClick={() => handleProfileClick(userRank.username)}
                />
              </div>

              <div className="flex-grow min-w-0">
                <h3
                  className="font-bold text-lg truncate"
                  onClick={() => handleProfileClick(userRank.username)}
                >
                  {userRank.username}
                </h3>
                <div className="flex flex-col text-sm opacity-80">
                  <div className="flex justify-between">
                    <span>{t("leaderboard.points", "Points")}:</span>
                    <span className="font-medium">{userRank.points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CO2 (kg):</span>
                    <span className="font-medium">
                      {(userRank.score / 1000).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
