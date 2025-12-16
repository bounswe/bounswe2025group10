import React, { createContext, useContext, useState, useEffect } from 'react';

const FontSizeContext = createContext();

export const useFontSize = () => useContext(FontSizeContext);

export const FontSizeProvider = ({ children }) => {
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('fontSize');
        return saved || 'medium';
    });

    useEffect(() => {
        localStorage.setItem('fontSize', fontSize);

        // Apply font size to root element for scalability
        // Using percentages: xs=50%, small=75%, medium=100%, large=125%, xlarge=150%
        const fontSizeMap = {
            xs: '50%',         // 8px base
            small: '75%',      // 12px base
            medium: '100%',    // 16px base
            large: '125%',     // 20px base
            xlarge: '150%'     // 24px base
        };
        document.documentElement.style.fontSize = fontSizeMap[fontSize];
    }, [fontSize]);

    return (
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
};
