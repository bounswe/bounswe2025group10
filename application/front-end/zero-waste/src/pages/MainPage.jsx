import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
import WasteHelperInput from "../components/features/WasteHelperInput";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../components/layout/Navbar";
import WeatherWidget from "../components/features/WeatherWidget";
import wasteService from "../services/wasteService";
import { tipsService } from "../services/tipsService";

// Constants
const WASTE_POINTS = {
  plastic: 30,
  paper: 15,
  glass: 20,
  metal: 35,
  electronic: 60,
  oilFats: 45,
  organic: 10
};


export default function MainPage() {
  const { currentTheme } = useTheme();
  const { t, language } = useLanguage();
  const [data, setData] = useState([]);
  const [sustainabilityTips, setSustainabilityTips] = useState([]);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pointsInfoRef = useRef(null);

  // Click outside handler for points info modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pointsInfoRef.current && !pointsInfoRef.current.contains(event.target)) {
        setShowPointsInfo(false);
      }
    };

    if (showPointsInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPointsInfo]);

  // Fetch waste data
  const fetchWasteData = useCallback(async () => {
    try {
      const response = await wasteService.getWasteData();
      const chartData = wasteService.transformWasteDataForChart(response.data);
      setData(chartData);
    } catch (error) {
      console.error("Failed to fetch waste data:", error);
    }
  }, []);

  // Create translated chart data that updates when language or data changes
  const translatedChartData = useMemo(() => {
    return data.map((item) => {
      // Map backend waste types to translation keys
      let typeKey = item.type.toLowerCase().replace('&', '');
      // Special case for oil&fats -> oilFats
      if (typeKey === 'oilfats') {
        typeKey = 'oilFats';
      }
      return {
        ...item,
        type: t(`mainPage.wasteTypes.${typeKey}`) || item.type,
      };
    });
  }, [data, language, t]);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await tipsService.getRecentTips(language);
        setSustainabilityTips(response.data);
      } catch (error) {
        console.error("Failed to fetch tips:", error);
      }
    };

    fetchTips();
    fetchWasteData();
  }, [fetchWasteData, language]);

  const handleAddWaste = useCallback(async ({ waste_type, amount }) => {
    setIsLoading(true);
    const payload = {
      waste_type: waste_type,
      amount: amount,
    };

    try {
      await wasteService.addWaste(payload);

      // Refetch the updated data
      await fetchWasteData();
    } catch (error) {
      console.error("Failed to add waste:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWasteData]);



  return (
    <Navbar active="home">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-5">
        {/* Welcome Banner */}
        <div
          className="rounded-lg p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border"
          style={{
            backgroundColor: currentTheme.primary,
            borderColor: currentTheme.border
          }}
        >
          <div className="flex-1 text-center md:text-left">
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-bold mb-1"
              style={{ color: currentTheme.primaryText }}
            >
              {t("mainPage.title")}
            </h1>
            <p
              className="text-sm sm:text-base opacity-80"
              style={{ color: currentTheme.primaryText }}
            >
              {t("mainPage.description")}
            </p>
          </div>
          <WeatherWidget />
        </div>

        {/* Input Section */}
        <section
          className="p-4 rounded-lg border mb-6"
          style={{
            backgroundColor: currentTheme.background,
            borderColor: currentTheme.border
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold"
              style={{ color: currentTheme.text }}
            >
              {t("wasteHelper.title")}
            </h2>
            <div className="relative" ref={pointsInfoRef}>
              <button
                className="px-3 py-1.5 text-xs rounded-full hover:opacity-80 border transition-colors"
                style={{
                  backgroundColor: currentTheme.hover,
                  color: currentTheme.text,
                  borderColor: currentTheme.border
                }}
                onClick={() => setShowPointsInfo(!showPointsInfo)}
              >
                ℹ️ {t("mainPage.pointsInfo")}
              </button>

              {showPointsInfo && (
                <div
                  className="absolute z-20 top-full mt-2 right-0 p-4 rounded-xl border shadow-xl w-64 backdrop-blur-sm"
                  style={{
                    backgroundColor: currentTheme.background,
                    borderColor: currentTheme.border
                  }}
                >
                  <h6
                    className="font-bold mb-3 text-sm border-b pb-2 text-center"
                    style={{ color: currentTheme.text, borderColor: currentTheme.border }}
                  >
                    {t("mainPage.pointsPerLabel")}
                  </h6>
                  <ul className="space-y-2 text-xs" style={{ color: currentTheme.text }}>
                    {Object.entries(WASTE_POINTS).map(([key, value]) => (
                      <li key={key} className="flex justify-between items-center">
                        <span className="opacity-80">{t(`mainPage.wasteTypes.${key}`)}</span>
                        <span className="font-mono font-bold" style={{ color: currentTheme.secondary }}>
                          {value} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <WasteHelperInput onSubmit={handleAddWaste} isLoading={isLoading} />
        </section>

        {/* Tips and Progress Section */}
        <section className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Sustainability Tips */}
          <div
            className="p-3 sm:p-4 rounded-lg border"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border
            }}
          >
            <h2
              className="text-base sm:text-lg font-bold mb-3"
              style={{ color: currentTheme.text }}
            >
              {t("mainPage.sustainabilityTips")}
            </h2>
            <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto">
              {Array.isArray(sustainabilityTips) && sustainabilityTips.map((tip) => (
                <div
                  key={tip.id}
                  className="p-2.5 sm:p-3 rounded-lg border-l-2 border"
                  style={{
                    backgroundColor: currentTheme.hover,
                    borderColor: currentTheme.border,
                    borderLeftColor: currentTheme.secondary
                  }}
                >
                  <h3
                    className="font-semibold mb-1 text-xs sm:text-sm"
                    style={{ color: currentTheme.text }}
                  >
                    {tip.title}
                  </h3>
                  <p
                    className="text-xs opacity-80 line-clamp-2"
                    style={{ color: currentTheme.text }}
                  >
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Chart */}
          <div
            className="p-3 sm:p-4 rounded-lg border"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border
            }}
          >
            <h2
              className="text-base sm:text-lg font-bold mb-3"
              style={{ color: currentTheme.text }}
            >
              {t("mainPage.yourProgress")}
            </h2>
            <div className="w-full h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={translatedChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={currentTheme.border}
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="type"
                    angle={-15}
                    textAnchor="end"
                    height={50}
                    interval={0}
                    tick={{ fill: currentTheme.text, fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: currentTheme.text, fontSize: 11 }}
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
                            <p className="font-semibold text-sm mb-1">{payload[0].payload.type}</p>
                            <p className="text-xs" style={{ color: currentTheme.secondary }}>
                              {t('mainPage.quantity', 'Quantity')}: <span className="font-bold">{payload[0].value} kg</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                    {Array.isArray(translatedChartData) && translatedChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={currentTheme.secondary}
                        opacity={0.7 + (index * 0.05)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </Navbar>
  );
}
