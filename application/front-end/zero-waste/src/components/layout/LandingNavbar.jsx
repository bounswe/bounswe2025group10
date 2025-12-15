import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { useFontSize } from "../../providers/FontSizeContext";

export default function LandingNavbar({ children, active }) {
    const { currentTheme, changeTheme, availableThemes, theme } = useTheme();
    const { t, changeLanguage, availableLanguages, language, isRTL } = useLanguage();
    const { fontSize, setFontSize } = useFontSize();
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { key: 'home', path: '/', icon: '🏠' },
        { key: 'login', path: '/login', icon: '🔑' },
        { key: 'signup', path: '/signup', icon: '📝' },
    ];

    return (
        <div className="flex h-screen" onClick={() => {
            setShowLanguageMenu(false);
            setShowThemeMenu(false);
            setShowFontSizeMenu(false);
        }}>
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
                    w-56 h-full
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
                onClick={() => {
                    setShowLanguageMenu(false);
                    setShowThemeMenu(false);
                }}
            >
                {/* Logo Section */}
                <div className="p-4 flex items-center justify-center border-b"
                    style={{ borderColor: currentTheme.border }}
                >
                    <span className="text-3xl">🌱</span>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`
                                flex items-center gap-3 px-4 py-2 rounded-lg no-underline
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
                        </Link>
                    ))}
                </nav>

                {/* Bottom Section - Controls */}
                <div className="p-3 border-t-2 space-y-1.5" style={{ borderColor: currentTheme.border }}>

                    {/* Language Selector */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowLanguageMenu(!showLanguageMenu);
                                setShowThemeMenu(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                            style={{
                                color: currentTheme.primaryText
                            }}
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
                                        className="block w-full text-left px-3 py-2 rounded hover:opacity-80 transition-opacity flex items-center gap-2"
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
                                setShowFontSizeMenu(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                            style={{
                                color: currentTheme.primaryText
                            }}
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
                                        className="block w-full text-left px-3 py-2 rounded hover:opacity-80 transition-opacity flex items-center gap-2"
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

                    {/* Font Size Selector */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFontSizeMenu(!showFontSizeMenu);
                                setShowLanguageMenu(false);
                                setShowThemeMenu(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:opacity-80 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                            style={{
                                color: currentTheme.primaryText
                            }}
                        >
                            <span className="text-lg">🔤</span>
                            <span>{t('settings.fontSize', 'Font Size')}</span>
                        </button>
                        {showFontSizeMenu && (
                            <div
                                className={`
                                    absolute bottom-full mb-2 rounded-lg shadow-lg p-2 min-w-48 z-50
                                    ${isRTL ? 'right-0' : 'left-0'}
                                `}
                                style={{ backgroundColor: currentTheme.primary }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {[
                                    { value: 'xs', label: t('settings.xs', 'Extra Small'), percent: '50%' },
                                    { value: 'small', label: t('settings.small', 'Small'), percent: '75%' },
                                    { value: 'medium', label: t('settings.medium', 'Medium'), percent: '100%' },
                                    { value: 'large', label: t('settings.large', 'Large'), percent: '125%' },
                                    { value: 'xlarge', label: t('settings.xlarge', 'X-Large'), percent: '150%' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setFontSize(option.value);
                                            setShowFontSizeMenu(false);
                                        }}
                                        className={`
                                            w-full text-left px-3 py-2 rounded transition-all mb-1 last:mb-0
                                            ${fontSize === option.value ? 'font-semibold' : 'hover:opacity-80'}
                                        `}
                                        style={{
                                            backgroundColor: fontSize === option.value ? currentTheme.secondary + '20' : 'transparent',
                                            color: currentTheme.primaryText,
                                            borderLeft: fontSize === option.value ? `3px solid ${currentTheme.secondary}` : 'none'
                                        }}
                                    >
                                        <div className="font-medium text-sm">{option.label}</div>
                                        <div className="text-xs opacity-70">{option.percent}</div>
                                    </button>
                                ))}
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
                        className="lg:hidden fixed inset-0 z-30"
                        style={{ backgroundColor: currentTheme.background, opacity: 0.6 }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main
                    className="flex-1 overflow-auto"
                    style={{ backgroundColor: currentTheme.background }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
