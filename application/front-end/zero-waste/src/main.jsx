// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import App from "./App";
import { AuthProvider } from "./providers/AuthContext";
import { LanguageProvider } from "./providers/LanguageContext";
import { ThemeProvider } from "./providers/ThemeContext";
import ToastProvider from "./providers/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      {/* 1️⃣  Language context for multilingual support */}
      <ThemeProvider>
        {/* 2️⃣  Theme context for color schemes */}
        <ToastProvider />
        {/* 3️⃣  Toast provider with theme support */}
        <BrowserRouter>
          {/* 4️⃣  Router */}
          <AuthProvider>
            {/* 5️⃣  Auth context */}
            <App /> {/* 6️⃣  App with all contexts available */}
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);
