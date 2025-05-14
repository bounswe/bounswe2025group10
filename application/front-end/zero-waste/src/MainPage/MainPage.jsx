console.log("MainPage loaded");
import React, { useState, useEffect } from "react";
import { useAuth } from "../Login/AuthContent";
import "./MainPage.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import Navbar from "../components/Navbar";
import WeatherWidget from "./WeatherWidget";
import axios from "axios";

export default function MainPage() {
  const { user, logout } = useAuth();
  const [wasteType, setWasteType] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState("");
  const [data, setData] = useState([]); 
  const [sustainabilityTips, setSustainabilityTips] = useState([]);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/tips/get_recent_tips`);
        setSustainabilityTips(response.data.data);
      } catch (error) {
        console.error("Failed to fetch tips:", error);
      }
    };

    const fetchWasteData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/waste/get/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/waste/get/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      console.error("Failed to add waste:", error);
    }

    setWasteType("");
    setWasteQuantity("");
  };

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Main Page" />

      <main className="container mx-auto px-4 py-4">
        {/* Header Section with Weather */}
        <div className="d-flex justify-content-between align-items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-0">
            Log Your Waste
          </h1>
          <WeatherWidget />
        </div>

        {/* Input Section */}
        <section className="mb-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card p-4">
              <label className="form-label" htmlFor="waste-type">Waste Type</label>
              <select
                id="waste-type"
                className="form-select"
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                required
              >
                <option value="">Select type</option>
                <option value="PLASTIC">Plastic</option>
                <option value="PAPER">Paper</option>
                <option value="GLASS">Glass</option>
                <option value="METAL">Metal</option>
              </select>
            </div>
            <div className="card p-4">
              <label className="form-label" htmlFor="waste-quantity">Waste Quantity(grams)</label>
              <input
                id="waste-quantity"
                type="number"
                className="form-control"
                value={wasteQuantity}
                onChange={(e) => setWasteQuantity(e.target.value)}
                placeholder="e.g., 2"
              />
            </div>
            <div className="card p-4 d-flex align-items-center justify-content-center">
              <button
                className="btn btn-success w-100"
                onClick={handleAddWaste}
              >
                Add Waste
              </button>
            </div>
          </div>
        </section>

        {/* Tips and Progress Section */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-3">Sustainability Tips</h2>
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
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-3">Your Progress</h2>
            <BarChart width={500} height={300} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity">
                {Array.isArray(data) &&
                  data.map((entry, index) => {
                    let barClass = "";
                    if (entry.type === "Plastic") barClass = "bar-plastic";
                    if (entry.type === "Glass") barClass = "bar-glass";
                    if (entry.type === "Paper") barClass = "bar-paper";
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
