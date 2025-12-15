// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css"; // Tailwind CSS

import App from "./App";
import { AuthProvider } from "./providers/AuthContext";
import { LanguageProvider } from "./providers/LanguageContext";
import { ThemeProvider } from "./providers/ThemeContext";
import ToastProvider from "./providers/ToastProvider";
import { FontSizeProvider } from "./providers/FontSizeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      {/* 1️⃣  Language context for multilingual support */}
      <ThemeProvider>
        {/* 2️⃣  Theme context for color schemes */}
        <FontSizeProvider>
          {/* 3️⃣  Settings context for user preferences */}
          <ToastProvider />
          {/* 4️⃣  Toast provider with theme support */}
          <BrowserRouter>
            {/* 5️⃣  Router */}
            <AuthProvider>
              {/* 6️⃣  Auth context */}
              <App /> {/* 7️⃣  App with all contexts available */}
            </AuthProvider>
          </BrowserRouter>
        </FontSizeProvider>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);
