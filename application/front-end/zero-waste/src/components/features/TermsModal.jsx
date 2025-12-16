import React from "react";
import { termsContent } from "../../data/termsContent"; 
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";

export default function TermsModal({ show, onClose }) {
  const { currentTheme } = useTheme();
  
  const { language } = useLanguage(); 
  
  if (!show) return null;

  // Fallback to English if the language isn't in our dictionary
  const content = termsContent[language] || termsContent["en"];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] transition-colors duration-300"
        style={{ 
          backgroundColor: currentTheme.background, 
          borderColor: currentTheme.border,
          borderWidth: '1px'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div 
          className="p-5 border-b flex justify-between items-center"
          style={{ borderColor: currentTheme.border }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ color: currentTheme.secondary }}
          >
            {content.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: currentTheme.text }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <p 
            className="whitespace-pre-wrap text-sm leading-relaxed"
            style={{ color: currentTheme.text, opacity: 0.9 }}
          >
            {content.body}
          </p>
        </div>


      </div>
    </div>
  );
}