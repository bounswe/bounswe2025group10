import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "../providers/ThemeContext";
import { useLanguage } from "../providers/LanguageContext";
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

const CustomDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme } = useTheme();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-between hover:opacity-80 text-sm"
        style={{
          backgroundColor: currentTheme.background,
          borderColor: currentTheme.border,
          color: currentTheme.text
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption?.label || "Select"}</span>
        <span className={`transform transition-transform ml-2 ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </div>
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-auto"
          style={{
            backgroundColor: currentTheme.background,
            borderColor: currentTheme.border
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-2 cursor-pointer hover:opacity-80 text-sm ${
                value === option.value ? "font-semibold" : ""
              }`}
              style={{
                backgroundColor: value === option.value ? currentTheme.hover : 'transparent',
                color: currentTheme.text
              }}
              onClick={() => {
                onChange({ target: { value: option.value } });
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function MainPage() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [wasteType, setWasteType] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState("");
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

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await tipsService.getRecentTips();
        setSustainabilityTips(response.data);
      } catch (error) {
        console.error("Failed to fetch tips:", error);
      }
    };

    fetchTips();
    fetchWasteData();
  }, [fetchWasteData]);

  const handleAddWaste = useCallback(async () => {
    if (!wasteType || !wasteQuantity) return;

    setIsLoading(true);
    const payload = {
      waste_type: wasteType.toUpperCase(),
      amount: wasteQuantity,
    };

    try {
      await wasteService.addWaste(payload);

      // Refetch the updated data
      await fetchWasteData();
      
      // Reset form
      setWasteType("");
      setWasteQuantity("");
    } catch (error) {
      console.error("Failed to add waste:", error);
    } finally {
      setIsLoading(false);
    }
  }, [wasteType, wasteQuantity, fetchWasteData]);

  // Memoized dropdown options
  const wasteTypeOptions = useMemo(() => [
    { value: "", label: t("mainPage.selectType") },
    { value: "PLASTIC", label: t("mainPage.wasteTypes.plastic") },
    { value: "PAPER", label: t("mainPage.wasteTypes.paper") },
    { value: "GLASS", label: t("mainPage.wasteTypes.glass") },
    { value: "METAL", label: t("mainPage.wasteTypes.metal") },
    { value: "ELECTRONIC", label: t("mainPage.wasteTypes.electronic") },
    { value: "OIL&FATS", label: t("mainPage.wasteTypes.oilFats") },
    { value: "ORGANIC", label: t("mainPage.wasteTypes.organic") },
  ], [t]);

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
        <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {/* Waste Type */}
          <div 
            className="p-4 rounded-lg border relative"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border
            }}
            ref={pointsInfoRef}
          >
            <div className="flex items-center justify-between mb-2">
              <label 
                className="text-sm font-semibold" 
                style={{ color: currentTheme.text }}
              >
                {t("mainPage.wasteType")}
              </label>
              <button
                className="px-2 py-1 text-xs rounded hover:opacity-80 border"
                style={{
                  backgroundColor: currentTheme.hover,
                  color: currentTheme.text,
                  borderColor: currentTheme.border
                }}
                onClick={() => setShowPointsInfo(!showPointsInfo)}
              >
                {t("mainPage.pointsInfo")}
              </button>
            </div>
            
            {showPointsInfo && (
              <div 
                className="absolute z-20 top-full mt-2 right-0 p-3 rounded-lg border shadow-xl w-56"
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.border
                }}
              >
                <h6 
                  className="font-semibold mb-2 text-xs"
                  style={{ color: currentTheme.text }}
                >
                  {t("mainPage.pointsPerLabel")}
                </h6>
                <ul className="space-y-1 text-xs" style={{ color: currentTheme.text }}>
                  {Object.entries(WASTE_POINTS).map(([key, value]) => (
                    <li key={key}>
                      <strong>{t(`mainPage.wasteTypes.${key}`)}:</strong> {value} {t("mainPage.pointsLabel")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <CustomDropdown
              value={wasteType}
              onChange={(e) => setWasteType(e.target.value)}
              options={wasteTypeOptions}
            />
          </div>

          {/* Waste Quantity */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border
            }}
          >
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: currentTheme.text }}
            >
              {t("mainPage.wasteQuantity")}
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-sm"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.border,
                color: currentTheme.text
              }}
              value={wasteQuantity}
              onChange={(e) => setWasteQuantity(e.target.value)}
              placeholder={t("mainPage.quantityPlaceholder")}
              step="25"
            />
          </div>

          {/* Add Button */}
          <div 
            className="p-4 rounded-lg border flex items-center"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border
            }}
          >
            <button
              className="w-full py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: currentTheme.secondary,
                color: currentTheme.background
              }}
              onClick={handleAddWaste}
              disabled={isLoading || !wasteType || !wasteQuantity}
            >
              {isLoading ? t("mainPage.adding", "Adding...") : t("mainPage.addWaste")}
            </button>
          </div>
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
                <BarChart data={data}>
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
                    contentStyle={{
                      backgroundColor: currentTheme.background,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '0.5rem',
                      color: currentTheme.text
                    }}
                  />
                  <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                    {Array.isArray(data) && data.map((entry, index) => (
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
