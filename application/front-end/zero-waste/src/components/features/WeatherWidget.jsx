import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLanguage } from "../../providers/LanguageContext";
import { useTheme } from "../../providers/ThemeContext";

const WeatherWidget = () => {
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const [weather, setWeather] = useState(null);
  const [weatherTip, setWeatherTip] = useState("");

  // Weather emoji mapping
  const getWeatherEmoji = (weatherCode) => {
    // Open-Meteo weather codes
    if (weatherCode >= 0 && weatherCode <= 3) return "☀️"; // Clear to partly cloudy
    if (weatherCode >= 45 && weatherCode <= 48) return "🌫️"; // Fog
    if (weatherCode >= 51 && weatherCode <= 67) return "🌧️"; // Rain
    if (weatherCode >= 71 && weatherCode <= 77) return "❄️"; // Snow
    if (weatherCode >= 80 && weatherCode <= 82) return "🌦️"; // Rain showers
    if (weatherCode >= 85 && weatherCode <= 86) return "🌨️"; // Snow showers
    if (weatherCode >= 95 && weatherCode <= 99) return "⛈️"; // Thunderstorm
    return "🌤️"; // Default
  };

  // Generate sustainability tip based on weather
  const getWeatherBasedTip = (temperature, weatherCode) => {
    if (weatherCode >= 51 && weatherCode <= 67) {
      return t("weather.tips.rainy");
    }
    if (temperature > 25) {
      return t("weather.tips.hot");
    }
    if (temperature < 10) {
      return t("weather.tips.cold");
    }
    if (weatherCode >= 0 && weatherCode <= 3) {
      return t("weather.tips.sunny");
    }
    return t("weather.tips.default");
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Istanbul coordinates: 41.0082, 28.9784
        const response = await axios.get(
          'https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=temperature_2m,weather_code&timezone=auto'
        );
        
        const currentWeather = response.data.current;
        const weatherData = {
          temperature: Math.round(currentWeather.temperature_2m),
          weatherCode: currentWeather.weather_code,
          emoji: getWeatherEmoji(currentWeather.weather_code),
          rawTemperature: currentWeather.temperature_2m
        };
        setWeather(weatherData);
        
        setWeatherTip(getWeatherBasedTip(currentWeather.temperature_2m, currentWeather.weather_code));
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      }
    };

    fetchWeather();
  }, []);

  // Update weather tip when language changes
  useEffect(() => {
    if (weather) {
      setWeatherTip(getWeatherBasedTip(weather.rawTemperature, weather.weatherCode));
    }
  }, [t, weather]);

  // Don't render anything if weather data hasn't loaded yet
  if (!weather) {
    return null;
  }

  return (
    <div 
      className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 shadow-sm border w-full md:w-80"
      style={{
        backgroundColor: currentTheme.background,
        borderColor: currentTheme.border
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-3xl sm:text-4xl flex-shrink-0">{weather.emoji}</span>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div 
              className="font-bold text-lg sm:text-xl"
              style={{ color: currentTheme.text }}
            >
              {weather.temperature}°C
            </div>
            <small 
              className="text-xs opacity-70"
              style={{ color: currentTheme.text }}
            >
              Istanbul
            </small>
          </div>
          <div className="flex items-start gap-1">
            <span className="text-sm flex-shrink-0">💡</span>
            <small 
              className="text-xs leading-tight"
              style={{ color: currentTheme.secondary }}
            >
              {weatherTip}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;