import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../providers/AuthContext";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import wasteService from "../services/wasteService";
import communityService from "../services/communityService";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    PieChart,
    Pie,
    Legend,
    ResponsiveContainer,
} from "recharts";

export default function Statistics() {
    const { token } = useAuth();
    const { currentTheme } = useTheme();
    const { t, language } = useLanguage();
    const [wasteData, setWasteData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [communityStats, setCommunityStats] = useState(null);

    // Fetch community statistics
    useEffect(() => {
        const fetchCommunityStats = async () => {
            try {
                const response = await communityService.getCommunityStats();
                setCommunityStats(response.data);
            } catch (error) {
                console.error('Failed to fetch community stats:', error);
            }
        };
        fetchCommunityStats();
    }, []);

    useEffect(() => {
        const fetchWasteData = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await wasteService.getWasteData(token);
                const backendData = response?.data;

                if (!Array.isArray(backendData)) {
                    console.error("Waste data is not an array:", backendData);
                    setWasteData([]);
                    return;
                }

                const chartData = backendData.map((item) => ({
                    type: item.waste_type.charAt(0) + item.waste_type.slice(1).toLowerCase(),
                    quantity: item.total_amount,
                }));

                setWasteData(chartData);
            } catch (error) {
                console.error("Failed to fetch waste data:", error);
                setWasteData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchWasteData();
    }, [token]);

    // Translate waste types for display
    const translatedWasteData = useMemo(() => {
        const wasteTypeMap = {
            'Plastic': 'plastic',
            'Paper': 'paper',
            'Glass': 'glass',
            'Metal': 'metal',
            'Electronic': 'electronic',
            'Oil & fats': 'oilFats',
            'Oil&fats': 'oilFats',
            'Oilfats': 'oilFats',
            'OIL&FATS': 'oilFats',
            'Organic': 'organic',
        };

        return wasteData.map(item => ({
            ...item,
            translatedType: t(`mainPage.wasteTypes.${wasteTypeMap[item.type] || item.type.toLowerCase()}`, item.type)
        }));
    }, [wasteData, t]);

    const getWasteColor = (type) => {
        const key = type.toLowerCase().replace(/\s+/g, '').replace('&', '');
        // Use theme chart colors if available, otherwise fall back to secondary color
        if (currentTheme.chartColors && currentTheme.chartColors[key]) {
            return currentTheme.chartColors[key];
        }
        return currentTheme.secondary;
    };

    const totalWaste = wasteData.reduce((sum, item) => sum + item.quantity, 0);
    const topWasteType = wasteData.length > 0
        ? wasteData.reduce((a, b) => (a.quantity > b.quantity ? a : b))
        : null;

    // Calculate environmental impact
    // Assumptions: 1kg recycled waste saves ~2.5kg CO2, equivalent to 0.05 trees, saves ~5kWh energy
    const environmentalImpact = useMemo(() => {
        const wasteInKg = totalWaste / 1000;
        return {
            co2Saved: (wasteInKg * 2.5).toFixed(2), // kg of CO2
            treesEquivalent: (wasteInKg * 0.05).toFixed(2), // number of trees
            energySaved: (wasteInKg * 5).toFixed(2), // kWh
        };
    }, [totalWaste]);

    // Format community stats for display
    const communityStatsDisplay = useMemo(() => {
        if (!communityStats) return [];
        return [
            { name: t('statistics.totalPosts', 'Total Posts'), value: communityStats.totalPosts },
            { name: t('statistics.totalTips', 'Total Tips'), value: communityStats.totalTips },
            { name: t('statistics.activeChallenges', 'Active Challenges'), value: communityStats.activeChallenges },
        ];
    }, [communityStats, t]);


    return (
        <Navbar active="statistics">
            <motion.main
                className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {/* Page Header */}
                <header className="mb-6">
                    <h1
                        className="text-2xl sm:text-3xl font-bold"
                        style={{ color: currentTheme.text }}
                    >
                        {t('statistics.title', 'Statistics')}
                    </h1>
                    <p
                        className="text-sm mt-2 opacity-70"
                        style={{ color: currentTheme.text }}
                    >
                        {t('statistics.subtitle', 'View your waste recycling progress and community insights')}
                    </p>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-lg opacity-70" style={{ color: currentTheme.text }}>
                            {t('common.loading', 'Loading...')}
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {/* Waste Progress Section */}
                        <section
                            className="rounded-xl border p-6"
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: currentTheme.border,
                            }}
                        >
                            <h2
                                className="text-xl font-bold mb-4"
                                style={{ color: currentTheme.text }}
                            >
                                {t('statistics.wasteProgress', 'Your Waste Progress')}
                            </h2>

                            {/* Encouraging message for waste progress */}
                            <div
                                className="mb-4 p-3 rounded-lg border-l-4"
                                style={{
                                    backgroundColor: currentTheme.secondary + '10',
                                    borderLeftColor: currentTheme.secondary
                                }}
                            >
                                <p className="text-sm" style={{ color: currentTheme.text }}>
                                    💚 {t('statistics.wasteEncouragement', 'Amazing work! Every item you recycle helps reduce pollution and conserve natural resources. Keep up the great effort!')}
                                </p>
                            </div>

                            {wasteData.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="opacity-70" style={{ color: currentTheme.text }}>
                                        {t('statistics.noWasteData', 'No waste data yet. Start logging your recycling efforts!')}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Bar Chart */}
                                    <div className="p-4 rounded-lg" style={{ backgroundColor: currentTheme.hover }}>
                                        <h3
                                            className="text-lg font-semibold mb-3"
                                            style={{ color: currentTheme.text }}
                                        >
                                            {t('statistics.wasteByType', 'Waste by Type')}
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={translatedWasteData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} />
                                                <XAxis
                                                    dataKey="translatedType"
                                                    angle={-15}
                                                    textAnchor="end"
                                                    height={80}
                                                    interval={0}
                                                    tick={{ fill: currentTheme.text, fontSize: 12 }}
                                                />
                                                <YAxis tick={{ fill: currentTheme.text }} />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div
                                                                    className="px-3 py-2 rounded-lg shadow-lg"
                                                                    style={{
                                                                        backgroundColor: currentTheme.background,
                                                                        border: `2px solid ${currentTheme.secondary}`,
                                                                        color: currentTheme.text
                                                                    }}
                                                                >
                                                                    <p className="font-semibold text-sm mb-1">{payload[0].payload.translatedType}</p>
                                                                    <p className="text-xs" style={{ color: currentTheme.secondary }}>
                                                                        {t('statistics.quantity', 'Quantity')}: <span className="font-bold">{payload[0].value} grams</span>
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="quantity">
                                                    {translatedWasteData.map((entry, index) => (
                                                        <Cell key={index} fill={getWasteColor(entry.type)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Pie Chart */}
                                    <div className="p-4 rounded-lg" style={{ backgroundColor: currentTheme.hover }}>
                                        <h3
                                            className="text-lg font-semibold mb-3"
                                            style={{ color: currentTheme.text }}
                                        >
                                            {t('statistics.wasteDistribution', 'Waste Distribution')}
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={translatedWasteData}
                                                    dataKey="quantity"
                                                    nameKey="translatedType"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={100}
                                                    labelLine={false}
                                                    label={({ percent }) =>
                                                        percent > 0 ? `${(percent * 100).toFixed(0)}%` : ""
                                                    }
                                                >
                                                    {translatedWasteData.map((entry, index) => (
                                                        <Cell key={index} fill={getWasteColor(entry.type)} />
                                                    ))}
                                                </Pie>
                                                <Legend
                                                    wrapperStyle={{ fontSize: "0.9rem", color: currentTheme.text }}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div
                                                                    className="px-3 py-2 rounded-lg shadow-lg"
                                                                    style={{
                                                                        backgroundColor: currentTheme.background,
                                                                        border: `2px solid ${currentTheme.secondary}`,
                                                                        color: currentTheme.text
                                                                    }}
                                                                >
                                                                    <p className="font-semibold text-sm mb-1">{payload[0].payload.translatedType}</p>
                                                                    <p className="text-xs" style={{ color: currentTheme.secondary }}>
                                                                        {t('statistics.quantity', 'Quantity')}: <span className="font-bold">{payload[0].value} grams</span>
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Summary Table */}
                                    <div className="lg:col-span-2">
                                        <div className="p-4 rounded-lg" style={{ backgroundColor: currentTheme.hover }}>
                                            <h3
                                                className="text-lg font-semibold mb-3"
                                                style={{ color: currentTheme.text }}
                                            >
                                                {t('statistics.summary', 'Summary')}
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse border" style={{ borderColor: currentTheme.border }}>
                                                    <thead>
                                                        <tr
                                                            className="border-b"
                                                            style={{ borderColor: currentTheme.border }}
                                                        >
                                                            <th
                                                                className="text-left py-2 px-4 border"
                                                                style={{ color: currentTheme.text, borderColor: currentTheme.border }}
                                                            >
                                                                {t('statistics.wasteType', 'Waste Type')}
                                                            </th>
                                                            <th
                                                                className="text-right py-2 px-4 border"
                                                                style={{ color: currentTheme.text, borderColor: currentTheme.border, textAlign: 'right' }}
                                                            >
                                                                {t('statistics.quantity', 'Quantity (g)')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {translatedWasteData.map((item, i) => (
                                                            <tr
                                                                key={i}
                                                                className="border-b"
                                                                style={{ borderColor: currentTheme.border }}
                                                            >
                                                                <td
                                                                    className="py-2 px-4 border"
                                                                    style={{ color: currentTheme.text, borderColor: currentTheme.border }}
                                                                >
                                                                    {item.translatedType}
                                                                </td>
                                                                <td
                                                                    className="text-right py-2 px-4 border"
                                                                    style={{ color: currentTheme.text, borderColor: currentTheme.border }}
                                                                >
                                                                    {item.quantity}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Text Summary */}
                                            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: currentTheme.secondary + '15' }}>
                                                <p style={{ color: currentTheme.text }}>
                                                    {t('statistics.totalWasteLogged', 'You\'ve logged a total of')}{" "}
                                                    <strong>{totalWaste} {t('statistics.grams', 'grams')}</strong>{" "}
                                                    {t('statistics.ofWaste', 'of waste')}.{" "}
                                                    {topWasteType && (
                                                        <>
                                                            {t('statistics.topType', 'Your top recycled type is')}{" "}
                                                            <strong>{topWasteType.type}</strong>!
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Environmental Impact Section */}
                        {
                            wasteData.length > 0 && (
                                <section
                                    className="rounded-xl border p-6"
                                    style={{
                                        backgroundColor: currentTheme.background,
                                        borderColor: currentTheme.border,
                                    }}
                                >
                                    <h2
                                        className="text-xl font-bold mb-4"
                                        style={{ color: currentTheme.text }}
                                    >
                                        {t('statistics.environmentalImpact', 'Environmental Impact')}
                                    </h2>

                                    {/* Encouraging message for environmental impact */}
                                    <div
                                        className="mb-4 p-3 rounded-lg border-l-4"
                                        style={{
                                            backgroundColor: currentTheme.secondary + '10',
                                            borderLeftColor: currentTheme.secondary
                                        }}
                                    >
                                        <p className="text-sm" style={{ color: currentTheme.text }}>
                                            🌱 {t('statistics.impactDescription', 'By recycling your waste, you\'ve made a positive impact on the environment!')}
                                        </p>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div
                                            className="rounded-lg p-4 text-center"
                                            style={{ backgroundColor: currentTheme.secondary + '15' }}
                                        >
                                            <div className="text-4xl mb-2">🌍</div>
                                            <div
                                                className="text-2xl font-bold mb-1"
                                                style={{ color: currentTheme.secondary }}
                                            >
                                                {environmentalImpact.co2Saved} kg
                                            </div>
                                            <div
                                                className="text-sm opacity-70"
                                                style={{ color: currentTheme.text }}
                                            >
                                                {t('statistics.co2Saved', 'CO₂ Saved')}
                                            </div>
                                        </div>
                                        <div
                                            className="rounded-lg p-4 text-center"
                                            style={{ backgroundColor: currentTheme.secondary + '15' }}
                                        >
                                            <div className="text-4xl mb-2">🌳</div>
                                            <div
                                                className="text-2xl font-bold mb-1"
                                                style={{ color: currentTheme.secondary }}
                                            >
                                                {environmentalImpact.treesEquivalent}
                                            </div>
                                            <div
                                                className="text-sm opacity-70"
                                                style={{ color: currentTheme.text }}
                                            >
                                                {t('statistics.treesEquivalent', 'Trees Equivalent')}
                                            </div>
                                        </div>
                                        <div
                                            className="rounded-lg p-4 text-center"
                                            style={{ backgroundColor: currentTheme.secondary + '15' }}
                                        >
                                            <div className="text-4xl mb-2">⚡</div>
                                            <div
                                                className="text-2xl font-bold mb-1"
                                                style={{ color: currentTheme.secondary }}
                                            >
                                                {environmentalImpact.energySaved} kWh
                                            </div>
                                            <div
                                                className="text-sm opacity-70"
                                                style={{ color: currentTheme.text }}
                                            >
                                                {t('statistics.energySaved', 'Energy Saved')}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )
                        }

                        {/* Community Statistics Section */}
                        <section
                            className="rounded-xl border p-6"
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: currentTheme.border,
                            }}
                        >
                            <h2
                                className="text-xl font-bold mb-4"
                                style={{ color: currentTheme.text }}
                            >
                                {t('statistics.communityStats', 'Community Statistics')}
                            </h2>

                            {/* Encouraging message for community */}
                            <div
                                className="mb-4 p-3 rounded-lg border-l-4"
                                style={{
                                    backgroundColor: currentTheme.secondary + '10',
                                    borderLeftColor: currentTheme.secondary
                                }}
                            >
                                <p className="text-sm" style={{ color: currentTheme.text }}>
                                    🤝 {t('statistics.communityEncouragement', 'Thank you for being an active member of our community! Together, we\'re building a sustainable future and inspiring others to make a difference.')}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3 mb-6">
                                {communityStatsDisplay.map((stat, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg p-4 text-center"
                                        style={{ backgroundColor: currentTheme.secondary + '15' }}
                                    >
                                        <div
                                            className="text-3xl font-bold mb-1"
                                            style={{ color: currentTheme.secondary }}
                                        >
                                            {stat.value.toLocaleString()}
                                        </div>
                                        <div
                                            className="text-sm opacity-70"
                                            style={{ color: currentTheme.text }}
                                        >
                                            {stat.name}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-lg mt-6" style={{ backgroundColor: currentTheme.hover }}>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={communityStatsDisplay}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: currentTheme.text, fontSize: 12 }}
                                        />
                                        <YAxis tick={{ fill: currentTheme.text }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: currentTheme.background,
                                                border: `2px solid ${currentTheme.secondary}`,
                                                borderRadius: '8px',
                                                color: currentTheme.text,
                                            }}
                                        />
                                        <Bar dataKey="value" fill={currentTheme.secondary} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div >
                )}
            </motion.main >
        </Navbar >
    );
}
