import React, { useState, useEffect } from "react";
import { useAuth } from "../Login/AuthContent";
import "./MainPage.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import Navbar from "../components/Navbar";
import WeatherWidget from "./WeatherWidget";
import axios from "axios";

const CustomDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="custom-dropdown">
      <div
        className="custom-dropdown-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? selectedOption.label : "Select type"}
        <span className={`dropdown-arrow ${isOpen ? "open" : ""}`}>▼</span>
      </div>
      {isOpen && (
        <div className="custom-dropdown-list">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-dropdown-item ${
                value === option.value ? "selected" : ""
              }`}
              onClick={() => handleSelect(option.value)}
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
  const { user, logout } = useAuth();
  const [wasteType, setWasteType] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState("");
  const [data, setData] = useState([]);
  const [sustainabilityTips, setSustainabilityTips] = useState([]);
  const [showPointsInfo, setShowPointsInfo] = useState(false);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/tips/get_recent_tips`
        );
        setSustainabilityTips(response.data.data);
      } catch (error) {
        console.error("Failed to fetch tips:", error);
      }
    };

    const fetchWasteData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/waste/get/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const backendData = response?.data?.data;
        if (!Array.isArray(backendData)) {
          console.error("Waste data is not an array:", backendData);
          return;
        }
        const chartData = backendData.map((item) => ({
          type:
            item.waste_type.charAt(0) + item.waste_type.slice(1).toLowerCase(),
          quantity: item.total_amount,
        }));

        setData(chartData);
      } catch (error) {
        console.error("Failed to fetch waste data:", error);
      }
    };

    fetchTips();
    fetchWasteData();
  }, []);

  const handleAddWaste = async () => {
    if (!wasteType || !wasteQuantity) return;

    const token = localStorage.getItem("accessToken");
    const payload = {
      waste_type: wasteType.toUpperCase(),
      amount: wasteQuantity,
    };

    try {
      console.log("Submitting waste:", payload);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/waste/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Refetch the updated data
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/waste/get/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const backendData = response?.data?.data;
      if (!Array.isArray(backendData)) {
        console.error("Waste data is not an array:", backendData);
        return;
      }
      const chartData = backendData.map((item) => ({
        type:
          item.waste_type.charAt(0) + item.waste_type.slice(1).toLowerCase(),
        quantity: item.total_amount,
      }));

      setData(chartData);
    } catch (error) {
      console.error("Failed to add waste:", error);
    }

    setWasteType("");
    setWasteQuantity("");
  };

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Main Page" />

      <main className="container mx-auto px-4 py-4">
        {/* Welcome Banner */}
        <div className="welcome-banner mb-4">
          <div className="welcome-content">
            <h1 className="welcome-title">Welcome to Zero Waste Challenge!</h1>
            <p className="welcome-text">
              Make a difference for a more sustainable world! Log your recycling
              efforts here to earn points and climb the Leaderboard. Every small
              action counts towards a greener future.
            </p>
          </div>
          <div className="weather-widget-container">
            <WeatherWidget />
          </div>
        </div>

        {/* Input Section */}
        <section className="mb-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="waste-input-card" style={{ position: "relative" }}>
              <div className="waste-label-container">
                <label className="waste-label" htmlFor="waste-type">
                  Waste Type
                </label>
                <button
                  className="points-info-button"
                  onClick={() => setShowPointsInfo(!showPointsInfo)}
                >
                  Points ⓘ
                </button>
              </div>
              {showPointsInfo && (
                <div className="points-info-card">
                  <h4 className="points-info-title">Points per 100g</h4>
                  <ul className="points-info-list">
                    <li>
                      <strong>Plastic:</strong> 30 points
                    </li>
                    <li>
                      <strong>Paper:</strong> 15 points
                    </li>
                    <li>
                      <strong>Glass:</strong> 20 points
                    </li>
                    <li>
                      <strong>Metal:</strong> 35 points
                    </li>
                    <li>
                      <strong>Electronic:</strong> 60 points
                    </li>
                    <li>
                      <strong>Oil & Fats:</strong> 45 points
                    </li>
                    <li>
                      <strong>Organic:</strong> 10 points
                    </li>
                  </ul>
                </div>
              )}
              <CustomDropdown
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                options={[
                  { value: "", label: "Select type" },
                  { value: "PLASTIC", label: "Plastic" },
                  { value: "PAPER", label: "Paper" },
                  { value: "GLASS", label: "Glass" },
                  { value: "METAL", label: "Metal" },
                  { value: "ELECTRONIC", label: "Electronic" },
                  { value: "OIL&FATS", label: "Oil & Fats" },
                  { value: "ORGANIC", label: "Organic" },
                ]}
              />
            </div>
            <div className="waste-input-card">
              <label className="waste-label" htmlFor="waste-quantity">
                Waste Quantity (grams)
              </label>
              <input
                id="waste-quantity"
                type="number"
                className="waste-input"
                value={wasteQuantity}
                onChange={(e) => setWasteQuantity(e.target.value)}
                placeholder="e.g., 500"
                step="25"
              />
            </div>
            <div className="waste-button-card">
              <button className="waste-add-button" onClick={handleAddWaste}>
                Add Waste
              </button>
            </div>
          </div>
        </section>

        {/* Tips and Progress Section */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="tips-progress-card">
            <h2 className="tips-progress-title">Sustainability Tips</h2>
            <ul className="list-unstyled">
              {Array.isArray(sustainabilityTips) &&
                sustainabilityTips.map((tip) => (
                  <li key={tip.id} className="tip-card mb-2">
                    <strong>{tip.title}</strong>
                    <br />
                    {tip.description}
                  </li>
                ))}
            </ul>
          </div>
          <div className="tips-progress-card">
            <h2 className="tips-progress-title">Your Progress</h2>
            <BarChart width={500} height={300} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="type"
                angle={-15}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity">
                {Array.isArray(data) &&
                  data.map((entry, index) => {
                    let barClass = "";
                    if (entry.type === "Plastic") barClass = "bar-plastic";
                    if (entry.type === "Glass") barClass = "bar-glass";
                    if (entry.type === "Paper") barClass = "bar-paper";
                    if (entry.type === "Metal") barClass = "bar-metal";
                    if (entry.type === "Electronic")
                      barClass = "bar-electronic";
                    if (entry.type === "Oil & fats") barClass = "bar-oil-fats";
                    if (entry.type === "Organic") barClass = "bar-organic";
                    return <Cell key={index} className={barClass} />;
                  })}
              </Bar>
            </BarChart>
          </div>
        </section>
      </main>

      <footer className="py-3 border-top text-center">
        <div className="footer-box">
          <button className="btn btn-outline-dark btn-sm ms-3" onClick={logout}>
            Log out
          </button>
        </div>
      </footer>
    </div>
  );
}
