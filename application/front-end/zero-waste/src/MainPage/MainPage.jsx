import React, { useState } from "react";
import { useAuth } from "../Login/AuthContent";
import "./MainPage.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import Navbar from "../components/Navbar";

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
    "Choose reusable products instead of single-use plastics.",
    "Bring your own bag when grocery shopping.",
    "Compost food scraps to reduce landfill waste.",
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

  return (
    <div className="main-bg min-vh-100 d-flex flex-column">
      <Navbar active="Main Page" />

      <main className="container mx-auto px-4 py-8">
        {/* Input Section */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Log Your Waste</h1>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card p-4">
              <label className="form-label">Waste Type</label>
              <input
                type="text"
                className="form-control"
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                placeholder="e.g., Plastic"
              />
            </div>
            <div className="card p-4">
              <label className="form-label">Waste Quantity</label>
              <input
                type="number"
                className="form-control"
                value={wasteQuantity}
                onChange={(e) => setWasteQuantity(e.target.value)}
                placeholder="e.g., 2"
              />
            </div>
            <div className="card p-4 d-flex align-items-center justify-content-center">
              <button className="btn btn-success w-100" onClick={handleAddWaste}>
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
              {sustainabilityTips.map((tip, index) => (
                <li key={index} className="tip-card mb-2">
                  {tip}
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