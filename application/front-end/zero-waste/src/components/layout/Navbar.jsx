import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "../../providers/LanguageContext";
import { useTheme } from "../../providers/ThemeContext";
import { useAuth } from "../../providers/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";

export default function Navbar({
  active = "home",
  children,
  fullWidth = false,
  navItems: propsNavItems,
}) {
  const { t, changeLanguage, availableLanguages, language, isRTL } =
    useLanguage();
  const { changeTheme, availableThemes, theme, currentTheme } = useTheme();
  const { logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  /* Custom nav items or default user items */
  const defaultNavItems = [
    { key: "home", path: "/mainPage", icon: "🏠" },
    { key: "tips", path: "/tips", icon: "💡" },
    { key: "challenges", path: "/challenges", icon: "🎯" },
    { key: "community", path: "/community", icon: "👥" },
    { key: "leaderboard", path: "/leaderboard", icon: "🏆" },
    { key: "achievements", path: "/achievements", icon: "🏅" },
    { key: "activities", path: "/activities", icon: "🌟" },
    { key: "recyclingCenters", path: "/recycling-centers", icon: "♻️" },
    { key: "statistics", path: "/statistics", icon: "📊" },
  ];

  const navItems = propsNavItems || defaultNavItems;

  return (
    <div
      className="flex h-screen"
      onClick={() => {
        setShowProfileMenu(false);
        setShowNotificationsMenu(false);
      }}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 z-50 p-2 rounded-lg shadow-lg"
        style={{
          backgroundColor: currentTheme.primary,
          color: currentTheme.primaryText,
          [isRTL ? "right" : "left"]: "1rem",
        }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {mobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`
          w-56 h-full
          flex flex-col
          ${isRTL ? "border-l" : "border-r"} shadow-lg
          transition-transform duration-300
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : isRTL
              ? "translate-x-full"
              : "-translate-x-full"
          }
          lg:translate-x-0
          fixed lg:static
          z-40
        `}
        style={{
          backgroundColor: currentTheme.primary,
          borderColor: currentTheme.border,
          [isRTL ? "right" : "left"]: 0,
        }}
      >
        {/* Logo Section */}
        <div
          className="p-4 flex items-center justify-center border-b"
          style={{ borderColor: currentTheme.border }}
        >
          <span className="text-3xl">🌱</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                flex items-center gap-3 px-4 py-2 rounded-lg no-underline
                transition-all duration-200
                hover:opacity-80
                ${isActive ? "font-semibold" : ""}
                ${isRTL ? "flex-row-reverse" : ""}
              `}
                style={{
                  color: isActive
                    ? currentTheme.secondary
                    : currentTheme.primaryText,
                  backgroundColor: isActive
                    ? currentTheme.hover
                    : "transparent",
                  textDecoration: "none",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label || t(`nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section - User Controls */}
        <div
          className="p-3 border-t-2 space-y-1.5"
          style={{ borderColor: currentTheme.border }}
        >
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotificationsMenu(!showNotificationsMenu);
                setShowLanguageMenu(false);
                setShowThemeMenu(false);
                setShowProfileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
              style={{
                color: currentTheme.primaryText,
              }}
            >
              <div className="relative">
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span>{t("common.notifications", "Notifications")}</span>
            </button>

            {showNotificationsMenu && (
              <div
                className={`
                  absolute bottom-full mb-2 rounded-lg shadow-lg p-0 min-w-64 max-w-xs z-50 overflow-hidden
                  ${isRTL ? "right-0" : "left-0"}
                `}
                style={{ backgroundColor: currentTheme.primary }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="p-3 border-b flex justify-between items-center"
                  style={{ borderColor: currentTheme.border }}
                >
                  <h3
                    className="font-semibold"
                    style={{ color: currentTheme.primaryText }}
                  >
                    {t("common.notifications", "Notifications")}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs hover:underline"
                      style={{ color: currentTheme.secondary }}
                    >
                      {t("common.markAllRead", "Mark all read")}
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div
                      className="p-4 text-center text-sm opacity-70"
                      style={{ color: currentTheme.primaryText }}
                    >
                      {t("common.noNotifications", "No notifications")}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b last:border-0 hover:opacity-90 cursor-pointer transition-colors ${
                          !notification.read ? "bg-opacity-10 bg-blue-500" : ""
                        }`}
                        style={{ borderColor: currentTheme.border }}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <p
                          className="text-sm mb-1"
                          style={{ color: currentTheme.primaryText }}
                        >
                          {notification.message}
                        </p>
                        <p
                          className="text-xs opacity-60"
                          style={{ color: currentTheme.primaryText }}
                        >
                          {new Date(
                            notification.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Settings Link (Replaces Theme/Language) */}
          <div className="relative">
            <Link
              to={isAdmin ? "/admin/settings" : "/settings"}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${
                isRTL ? "flex-row-reverse" : ""
              } no-underline`}
              style={{
                color: currentTheme.primaryText,
                textDecoration: "none",
              }}
            >
              <span className="text-lg">⚙️</span>
              <span>{t("settings.title", "Settings")}</span>
            </Link>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
              style={{
                color: currentTheme.primaryText,
              }}
            >
              <span className="text-lg">👤</span>
              <span>{t("nav.profile")}</span>
            </button>
            {showProfileMenu && (
              <div
                className={`
                  absolute bottom-full mb-2 rounded-lg shadow-lg p-2 min-w-48 z-50
                  ${isRTL ? "right-0" : "left-0"}
                `}
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Link
                  to={isAdmin ? "/admin/profile" : "/profile"}
                  className="block px-3 py-2 rounded hover:opacity-80 transition-opacity no-underline"
                  style={{
                    color: currentTheme.primaryText,
                    textDecoration: "none",
                  }}
                  onClick={() => setShowProfileMenu(false)}
                >
                  👤 {t("nav.profile")}
                </Link>

                {/* --- ADDED: Preferences Link --- */}
                <Link
                  to="/preferences"
                  className="block px-3 py-2 rounded hover:opacity-80 transition-opacity no-underline"
                  style={{
                    color: currentTheme.primaryText,
                    textDecoration: "none",
                  }}
                  onClick={() => setShowProfileMenu(false)}
                >
                  🛡️ {t("nav.preferences", "Privacy & Account")}
                </Link>
                {/* ------------------------------- */}

                <Link
                  to="/invite"
                  className="block px-3 py-2 rounded hover:opacity-80 transition-opacity no-underline"
                  style={{
                    color: currentTheme.primaryText,
                    textDecoration: "none",
                  }}
                  onClick={() => setShowProfileMenu(false)}
                >
                  ✉️ {t("nav.inviteFriend")}
                </Link>

                <hr
                  className="my-2"
                  style={{ borderColor: currentTheme.border }}
                />
                <button
                  className="block w-full text-left px-3 py-2 rounded hover:opacity-80 transition-opacity"
                  style={{ color: currentTheme.primaryText }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                >
                  🚪 {t("common.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay - Must be after sidebar to not block it */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          style={{ backgroundColor: currentTheme.background, opacity: 0.7 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <main
          className={`flex-1 overflow-auto ${
            fullWidth ? "" : "p-6"
          } pt-20 lg:pt-6`}
          style={{ backgroundColor: currentTheme.background }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
