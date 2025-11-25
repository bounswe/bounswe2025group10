import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Import the weather service from the separate weather.ts file
import { weatherService } from '../weather';

describe('weatherService (weather.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeatherByCity', () => {
    it('should fetch weather data for a given city', async () => {
      const mockWeatherData = {
        name: 'Istanbul',
        weather: [{ main: 'Clear', description: 'clear sky' }],
        main: { temp: 25 },
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockWeatherData });

      const result = await weatherService.getWeatherByCity('Istanbul');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            q: 'Istanbul',
            appid: expect.any(String),
            units: 'metric',
          },
        }
      );
      expect(result).toEqual(mockWeatherData);
    });

    it('should handle API errors', async () => {
      const error = new Error('City not found');
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(weatherService.getWeatherByCity('InvalidCity')).rejects.toThrow('City not found');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(weatherService.getWeatherByCity('London')).rejects.toThrow('Network Error');
    });
  });
});
