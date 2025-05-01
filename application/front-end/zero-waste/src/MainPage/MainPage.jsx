// src/pages/MainPage.jsx
import React, { useState } from "react";
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
import "bootstrap/dist/css/bootstrap.min.css";

export default function MainPage() {
  const { user, logout } = useAuth();
  const [wasteType, setWasteType] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState("");
  const [data, setData] = useState([
    { type: "Plastic", quantity: 3 },
    { type: "Glass", quantity: 1 },
    { type: "Paper", quantity: 2 },
  ]);

  const sustainabilityTips = [
    {
      text: "Choose reusable products instead of single-use plastics.",
      style: "bg-light-success",
    },
    {
      text: "Bring your own bag when grocery shopping.",
      style: "bg-light-green",
    },
    {
      text: "Compost food scraps to reduce landfill waste.",
      style: "bg-pale-green",
    },
  ];

  const handleAddWaste = () => {
    if (!wasteType || !wasteQuantity) return;
    const qty = Number(wasteQuantity);
    setData((prev) => {
      const existing = prev.find((d) => d.type === wasteType);
      if (existing) {
        return prev.map((d) =>
          d.type === wasteType ? { ...d, quantity: d.quantity + qty } : d
        );
      }
      return [...prev, { type: wasteType, quantity: qty }];
    });
    setWasteType("");
    setWasteQuantity("");
  };

  const navItems = [
    "Tips",
    "Achievement Page",
    "Leaderboard",
    "Main Page",
    "Community",
    "Challenges",
    "Profile",
  ];

  return (
    <div className="main-bg min-vh-100 d-flex flex-column text-white">
      {/* Header + Nav */}
      <header className="py-3 border-bottom border-secondary">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="header-highlight">
            <h1 className="h4 mb-0">ZERO WASTE CHALLENGE</h1>
          </div>
          <nav className="d-flex flex-wrap">
            {navItems.map((item) => (
              <div key={item} className="nav-highlight">
                <a
                  href="#"
                  className={`nav-link text-white px-2 ${
                    item === "Main Page" ? "active fw-bold" : ""
                  }`}
                >
                  {item}
                </a>
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-fluid flex-grow-1 py-5">
        {/* Input Row */}
        <div className="row mb-5">
          <div className="col-md-4 mb-3">
            <div className="input-card">
              <label className="form-label">Log the waste type</label>
              <input
                type="text"
                className="form-control"
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                placeholder="e.g. Plastic"
              />
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="input-card">
              <label className="form-label">Log the waste quantity</label>
              <input
                type="number"
                className="form-control"
                value={wasteQuantity}
                onChange={(e) => setWasteQuantity(e.target.value)}
                placeholder="e.g. 2"
              />
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="add-button-wrapper">
              <button className="btn btn-success" onClick={handleAddWaste}>
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Tip & Chart */}
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card tip-and-progress-box text-dark h-100 p-3">
              <h5 className="card-title">Latest Sustainability Tips</h5>
              <div className="d-flex flex-column gap-2">
                {sustainabilityTips.map((tip, index) => (
                  <div className={`tip-card`} key={index}>
                    {tip.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card tip-and-progress-box text-dark h-100 p-3">
              <h5 className="card-title">Your Progress</h5>
              <BarChart width={500} height={300} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity">
                  {data.map((entry, index) => {
                    let barClass = "";
                    if (entry.type === "Plastic") barClass = "bar-plastic";
                    if (entry.type === "Glass") barClass = "bar-glass";
                    if (entry.type === "Paper") barClass = "bar-paper";
                    return <Cell key={index} className={barClass} />;
                  })}
                </Bar>
              </BarChart>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 border-top border-secondary text-center">
        <div className="footer-box">
          Welcome, {user?.email}! You’re logged in.{" "}
          <button className="btn btn-outline-dark btn-sm ms-3" onClick={logout}>
            Log out
          </button>
        </div>
      </footer>
    </div>
  );
}
