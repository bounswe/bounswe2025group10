// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import App from "./App";
import { AuthProvider } from "./Login/AuthContent";
import ToastProvider from "./providers/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider />
    {/* 0️⃣  ToastProvider at the very top */}
      <BrowserRouter>
        {/* 1️⃣  Router at the very top */}
        <AuthProvider>
          {/* 2️⃣  Context lives inside the router */}
          <App /> {/* 3️⃣  App (useRoutes) lives inside both */}
        </AuthProvider>
      </BrowserRouter>
    <ToastProvider />
  </React.StrictMode>
);
