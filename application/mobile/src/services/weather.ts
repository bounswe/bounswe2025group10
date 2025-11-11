import axios from 'axios';

// Replace with your actual OpenWeatherMap API key or store in env
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export interface WeatherData {
  name: string; // city name
  weather: { main: string; description: string }[];
  main: { temp: number };
}

export const weatherService = {
  getWeatherByCity: async (city: string): Promise<WeatherData> => {
    const response = await axios.get<WeatherData>(BASE_URL, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric',
      },
    });
    return response.data;
  },
};
