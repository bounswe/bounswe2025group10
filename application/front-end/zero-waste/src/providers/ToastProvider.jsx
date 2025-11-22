// src/providers/ToastProvider.jsx
import { ToastContainer } from "react-toastify";
import { useTheme } from "./ThemeContext";
import { useLanguage } from "./LanguageContext";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
    const { currentTheme } = useTheme();
    const { language } = useLanguage();
    
    const isRTL = language === 'ar';

    return (
        <ToastContainer
            position={isRTL ? "top-left" : "top-right"}
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={isRTL}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            toastStyle={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
            }}
            progressStyle={{
                background: currentTheme.primary,
            }}
        />
    );
}
