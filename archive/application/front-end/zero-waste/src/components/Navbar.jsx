import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";

export default function Navbar({ active = "Home Page" }) {
  const navItems = [
    "Tips",
    "Achievements",
    "Leaderboard",
    "Challenges",
    "Community",
    "Profile",
  ];

  if (!navItems.includes(active)) {
    active = "Home Page";
  }

  const navMap = {
    "Home Page": "/",
    Tips: "/tips",
    Achievements: "/achievements",
    Leaderboard: "/leaderboard",
    Challenges: "/challenges",
    Community: "/community",
    Profile: "/profile",
  };

  return (
    <header className="navbar-container py-3">
      <div className="container d-flex justify-content-between align-items-center">
        <div className="brand">
          <a
            href="/"
            className={`nav-link px-3 py-2 ${
              active === "Home Page" ? "active-link" : "hover-link"
            }`}
          >
            Zero Waste 🌱
          </a>
        </div>
        <nav className="d-flex flex-wrap">
          {navItems.map((item) => (
            <div key={item} className="nav-item">
              <a
                href={navMap[item]}
                className={`nav-link px-3 py-2 ${
                  item === active ? "active-link" : "hover-link"
                }`}
              >
                {item}
              </a>
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}