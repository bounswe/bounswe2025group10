import React, { useState } from "react";
import { useLanguage } from "../../providers/LanguageContext";
import { useTheme } from "../../providers/ThemeContext";
import { useAuth } from "../../providers/AuthContext";

export default function Navbar({ active = "home", children }) {
  const { t, changeLanguage, availableLanguages, language, isRTL } = useLanguage();
  const { changeTheme, availableThemes, theme, currentTheme } = useTheme();
  const { logout } = useAuth();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { key: "home", path: "/", icon: "🏠" },
    { key: "tips", path: "/tips", icon: "💡" },
    { key: "achievements", path: "/achievements", icon: "🏆" },
    { key: "leaderboard", path: "/leaderboard", icon: "📊" },
    { key: "challenges", path: "/challenges", icon: "🎯" },
    { key: "community", path: "/community", icon: "👥" },
    { key: "recycling", path: "/recycling-centers", icon: "♻️" },
  ];

  return (
    <div className="flex h-screen" onClick={() => { setShowLanguageMenu(false); setShowThemeMenu(false); setShowProfileMenu(false); }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 z-50 p-2 rounded-lg shadow-lg"
        style={{
          backgroundColor: currentTheme.primary,
          color: currentTheme.primaryText,
          [isRTL ? 'right' : 'left']: '1rem'
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`
          w-64 h-full
          flex flex-col
          ${isRTL ? 'border-l' : 'border-r'} shadow-lg
          transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
          lg:translate-x-0
          fixed lg:static
          z-40
        `}
        style={{
          backgroundColor: currentTheme.primary,
          borderColor: currentTheme.border,
          [isRTL ? 'right' : 'left']: 0
        }}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-center border-b"
          style={{ borderColor: currentTheme.border }}
        >
          <span className="text-4xl">🌱</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg no-underline
                transition-all duration-200
                hover:opacity-80
                ${active === item.key ? 'font-semibold' : ''}
                ${isRTL ? 'flex-row-reverse' : ''}
              `}
              style={{
                color: active === item.key ? currentTheme.secondary : currentTheme.primaryText,
                backgroundColor: active === item.key ? currentTheme.hover : 'transparent',
                textDecoration: 'none'
              }}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{t(`nav.${item.key}`)}</span>
            </a>
          ))}
        </nav>

        {/* Bottom Section - User Controls */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: currentTheme.border }}>
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLanguageMenu(!showLanguageMenu);
                setShowThemeMenu(false);
                setShowProfileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ color: currentTheme.primaryText }}
            >
              <span className="text-lg">
                {availableLanguages.find((l) => l.code === language)?.flag}
              </span>
              <span>{t('common.language')}</span>
            </button>
            {showLanguageMenu && (
              <div
                className={`
                  absolute bottom-full mb-2 rounded-lg shadow-lg p-2 min-w-max z-50
                  ${isRTL ? 'right-0' : 'left-0'}
                `}
                style={{ backgroundColor: currentTheme.primary }}
              >
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded hover:opacity-80 transition-opacity"
                    style={{
                      color: language === lang.code ? currentTheme.secondary : currentTheme.primaryText,
                      backgroundColor: language === lang.code ? currentTheme.hover : 'transparent',
                    }}
                  >
                    {lang.flag} {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowThemeMenu(!showThemeMenu);
                setShowLanguageMenu(false);
                setShowProfileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ color: currentTheme.primaryText }}
            >
              <span className="text-lg">
                {availableThemes.find((t) => t.code === theme)?.icon}
              </span>
              <span>{t('common.theme')}</span>
            </button>
            {showThemeMenu && (
              <div
                className={`
                  absolute bottom-full mb-2 rounded-lg shadow-lg p-2 min-w-max z-50
                  ${isRTL ? 'right-0' : 'left-0'}
                `}
                style={{ backgroundColor: currentTheme.primary }}
              >
                {availableThemes.map((themeOption) => (
                  <button
                    key={themeOption.code}
                    onClick={() => {
                      changeTheme(themeOption.code);
                      setShowThemeMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded hover:opacity-80 transition-opacity"
                    style={{
                      color: theme === themeOption.code ? currentTheme.secondary : currentTheme.primaryText,
                      backgroundColor: theme === themeOption.code ? currentTheme.hover : 'transparent',
                    }}
                  >
                    {themeOption.icon} {t(`themes.${themeOption.code}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
                setShowLanguageMenu(false);
                setShowThemeMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ color: currentTheme.primaryText }}
            >
              <span className="text-lg">👤</span>
              <span>{t('nav.profile')}</span>
            </button>
            {showProfileMenu && (
              <div
                className={`
                  absolute bottom-full mb-2 rounded-lg shadow-lg p-2 min-w-48 z-50
                  ${isRTL ? 'right-0' : 'left-0'}
                `}
                style={{ backgroundColor: currentTheme.primary }}
              >
                <a
                  href="/profile"
                  className="block px-3 py-2 rounded hover:opacity-80 transition-opacity no-underline"
                  style={{ color: currentTheme.primaryText, textDecoration: 'none' }}
                  onClick={() => setShowProfileMenu(false)}
                >
                  {t("nav.profile")}
                </a>
                <a
                  href="/settings"
                  className="block px-3 py-2 rounded hover:opacity-80 transition-opacity no-underline"
                  style={{ color: currentTheme.primaryText, textDecoration: 'none' }}
                  onClick={() => setShowProfileMenu(false)}
                >
                  {t("common.settings")}
                </a>
                <a
  href="/invite"
  className="block px-3 py-2 rounded hover:opacity-80 transition-opacity no-underline"
  style={{ color: currentTheme.primaryText, textDecoration: "none" }}
  onClick={() => setShowProfileMenu(false)}
>
  {t("nav.inviteFriend")}
</a>

                <hr className="my-2" style={{ borderColor: currentTheme.border }} />
                <button
                  className="block w-full text-left px-3 py-2 rounded hover:opacity-80 transition-opacity"
                  style={{ color: currentTheme.primaryText }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                >
                  {t("common.logout")}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 pt-20 lg:pt-6" style={{ backgroundColor: currentTheme.background }}>
          {children}
        </main>
      </div>
    </div>
  );
}