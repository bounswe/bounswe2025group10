import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import LandingNavbar from "../components/layout/LandingNavbar";

export default function LandingPage() {
    const { currentTheme, theme } = useTheme();
    const { t } = useLanguage();

    return (
        <LandingNavbar active="home">
            <div className="flex flex-col min-h-full">
                {/* Hero Section */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 py-20">
                    <h1
                        className="text-5xl sm:text-6xl font-extrabold mb-6 max-w-4xl"
                        style={{ color: currentTheme.text }}
                    >
                        {t("landing.title", "Make a Difference for a Sustainable Future")}
                    </h1>
                    <p
                        className="text-xl sm:text-2xl mb-10 max-w-2xl opacity-80"
                        style={{ color: currentTheme.text }}
                    >
                        {t("landing.subtitle", "Track your waste, earn points, and join a community of changemakers.")}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/signup"
                            className="px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition-transform hover:scale-105"
                            style={{
                                backgroundColor: currentTheme.secondary,
                                color: theme === 'highContrast' ? '#000000' : '#ffffff'
                            }}
                        >
                            {t("landing.cta", "Start Your Journey")}
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 rounded-xl text-lg font-bold border transition-colors hover:bg-opacity-5"
                            style={{
                                borderColor: currentTheme.text,
                                color: currentTheme.text,
                                backgroundColor: 'transparent'
                            }}
                        >
                            {t("nav.login", "Login")}
                        </Link>
                    </div>

                    {/* Features Preview */}
                    <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                        <div
                            className="p-8 rounded-2xl border text-left shadow-sm"
                            style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.hover }}
                        >
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: currentTheme.text }}>
                                {t("landing.features.track.title", "Track Waste")}
                            </h3>
                            <p className="opacity-80" style={{ color: currentTheme.text }}>
                                {t("landing.features.track.desc", "Log your daily recycling and waste to visualize your impact over time.")}
                            </p>
                        </div>
                        <div
                            className="p-8 rounded-2xl border text-left shadow-sm"
                            style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.hover }}
                        >
                            <div className="text-4xl mb-4">🏆</div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: currentTheme.text }}>
                                {t("landing.features.points.title", "Earn Points")}
                            </h3>
                            <p className="opacity-80" style={{ color: currentTheme.text }}>
                                {t("landing.features.points.desc", "Climb the leaderboard and earn achievements for your sustainable actions.")}
                            </p>
                        </div>
                        <div
                            className="p-8 rounded-2xl border text-left shadow-sm"
                            style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.hover }}
                        >
                            <div className="text-4xl mb-4">🤝</div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: currentTheme.text }}>
                                {t("landing.features.community.title", "Community")}
                            </h3>
                            <p className="opacity-80" style={{ color: currentTheme.text }}>
                                {t("landing.features.community.desc", "Connect with others, share tips, and participate in eco-challenges.")}
                            </p>
                        </div>
                    </div>
                </div>


            </div>
        </LandingNavbar>
    );
}
