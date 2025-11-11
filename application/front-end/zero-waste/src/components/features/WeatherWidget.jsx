import React, { useState, useEffect } from "react";
import axios from "axios";

const WeatherWidget = () => {
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
      return "Rainy weather is perfect for collecting rainwater! Set up containers to water your plants naturally.";
    }
    if (temperature > 25) {
      return "Hot weather tip: Use natural ventilation and fans instead of AC when possible to reduce energy consumption.";
    }
    if (temperature < 10) {
      return "Cold weather tip: Layer clothing and use blankets instead of cranking up the heat to save energy.";
    }
    if (weatherCode >= 0 && weatherCode <= 3) {
      return "Sunny day! Perfect for air-drying clothes instead of using the dryer to save energy.";
    }
    return "Every day is a good day to reduce waste and live sustainably!";
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Istanbul coordinates: 41.0082, 28.9784
        const response = await axios.get(
          'https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=temperature_2m,weather_code&timezone=auto'
        );
        
        const currentWeather = response.data.current;
        setWeather({
          temperature: Math.round(currentWeather.temperature_2m),
          weatherCode: currentWeather.weather_code,
          emoji: getWeatherEmoji(currentWeather.weather_code)
        });
        
        setWeatherTip(getWeatherBasedTip(currentWeather.temperature_2m, currentWeather.weather_code));
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      }
    };

    fetchWeather();
  }, []);

  // Don't render anything if weather data hasn't loaded yet
  if (!weather) {
    return null;
  }

  return (
    <div className="weather-widget card p-3" style={{ maxWidth: '400px' }}>
      <div className="d-flex align-items-center">
        <span className="fs-2 me-3">{weather.emoji}</span>
        <div className="d-flex flex-column">
          <div className="d-flex align-items-center mb-1">
            <div className="fw-bold me-2">{weather.temperature}°C</div>
            <small className="text-muted">Istanbul</small>
          </div>
          <div className="weather-tip">
            <small className="text-success">
              💡 {weatherTip}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;