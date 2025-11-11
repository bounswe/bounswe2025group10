import React, { useState, useEffect } from "react";
import { useAuth } from "../Login/AuthContent";
import "./MainPage.css";
import WasteHelperInput from "./WasteHelperInput";
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
import Navbar from "../../components/layout/Navbar";
import WeatherWidget from "../../components/features/WeatherWidget";
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

const fetchWasteData = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/waste/get/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const backendData = response?.data?.data;
    if (!Array.isArray(backendData)) {
      console.error("Waste data is not an array:", backendData);
      return;
    }

    const chartData = backendData.map((item) => ({
      type: item.waste_type.charAt(0) + item.waste_type.slice(1).toLowerCase(),
      quantity: item.total_amount,
    }));

    setData(chartData);
  } catch (error) {
    console.error("Failed to fetch waste data:", error);
  }
};


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
<WasteHelperInput
  onSubmit={async ({ waste_type, amount }) => {
    const token = localStorage.getItem("accessToken");

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/waste/`,
      { waste_type, amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await fetchWasteData();
  }}
/>

</section>


        {/* Tips and Progress Section */}
        <section className="grid gap-6 sm:grid-cols-2">
          {/* Sustainability Tips */}
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
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
            </ResponsiveContainer>

            {/*Pie Chart + Table + Text Summary */}
            <div className="mt-6">
              <h3 className="tips-progress-title">Waste Distribution (Pie)</h3>
              {data && data.reduce((sum, item) => sum + item.quantity, 0) === 0 ? (
                <div className="chart-placeholder">
                  <p>No waste data yet — add some to see your distribution 🍃</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="quantity"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      labelLine={false}
                      label={({ name, percent }) =>
                        percent > 0 ? `${(percent * 100).toFixed(0)}%` : ""
                      }
                      labelPosition="inside"
                    >
                      {data.map((entry, index) => {
                        const type = entry.type
                          .toLowerCase()
                          .replace("&", "and")
                          .replace(/\s+/g, "-");
                        const colorMap = {
                          plastic: "#ffadad",
                          paper: "#a0c4ff",
                          glass: "#ffd6a5",
                          metal: "#9bf6ff",
                          electronic: "#bdb2ff",
                          "oil-and-fats": "#fdffb6",
                          organic: "#1c8207ff",
                        };
                        return <Cell key={index} fill={colorMap[type] || "#ccc"} />;
                      })}
                    </Pie>
                    <Legend
                      payload={data.map((entry) => {
                        const type = entry.type
                          .toLowerCase()
                          .replace("&", "and")
                          .replace(/\s+/g, "-");
                        const colorMap = {
                          plastic: "#ffadad",
                          paper: "#a0c4ff",
                          glass: "#ffd6a5",
                          metal: "#9bf6ff",
                          electronic: "#bdb2ff",
                          "oil-and-fats": "#fdffb6",
                          organic: "#1c8207ff",
                        };
                        return {
                          id: entry.type,
                          type: "square",
                          value: entry.type,
                          color: colorMap[type] || "#ccc",
                        };
                      })}
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{
                        fontSize: "0.9rem",
                        color: "#1e5631",
                        marginTop: "1rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {/* Table */}
              <div className="mt-4">
                <h3 className="tips-progress-title">Tabular Summary</h3>
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Waste Type</th>
                      <th>Total Quantity (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr key={i}>
                        <td>{item.type}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Text Summary */}
              <div className="mt-4">
                <h3 className="tips-progress-title">Summary</h3>
                {data.length > 0 ? (
                  <p>
                    You’ve logged a total of{" "}
                    <strong>
                      {data.reduce((a, b) => a + b.quantity, 0)} grams
                    </strong>{" "}
                    of waste. Your top recycled type is{" "}
                    <strong>
                      {data.reduce((a, b) => (a.quantity > b.quantity ? a : b)).type}
                    </strong>
                    !
                  </p>
                ) : (
                  <p>No data yet — start logging waste to see your progress!</p>
                )}
              </div>
            </div>
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
