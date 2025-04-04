import axios from 'axios';

/**
 * Weather API Service
 * Handles API calls to WeatherAPI.com for destination weather information
 */
class WeatherService {
  private apiKey = process.env.WEATHER_API_KEY || '';
  private baseUrl = 'https://api.weatherapi.com/v1';
  
  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: location,
          aqi: 'no'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }
  
  /**
   * Get forecast for a location for specified number of days
   */
  async getForecast(location: string, days: number = 3) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast.json`, {
        params: {
          key: this.apiKey,
          q: location,
          days,
          aqi: 'no',
          alerts: 'no'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  }
  
  /**
   * Format the weather data into our application's structure
   */
  formatWeatherData(data: any, location: string) {
    if (!data || !data.current || !data.forecast) {
      throw new Error('Invalid weather data format');
    }
    
    const current = data.current;
    const forecast = data.forecast.forecastday;
    
    // Calculate averages from forecast
    const avgTemp = forecast.reduce((sum: number, day: any) => sum + day.day.avgtemp_c, 0) / forecast.length;
    const minTemp = Math.min(...forecast.map((day: any) => day.day.mintemp_c));
    const maxTemp = Math.max(...forecast.map((day: any) => day.day.maxtemp_c));
    
    // Determine season based on hemisphere and month
    const lat = data.location.lat;
    const month = new Date().getMonth() + 1; // 1-12
    let season = '';
    
    if (lat >= 0) { // Northern hemisphere
      if (month >= 3 && month <= 5) season = 'Spring';
      else if (month >= 6 && month <= 8) season = 'Summer';
      else if (month >= 9 && month <= 11) season = 'Fall';
      else season = 'Winter';
    } else { // Southern hemisphere
      if (month >= 3 && month <= 5) season = 'Fall';
      else if (month >= 6 && month <= 8) season = 'Winter';
      else if (month >= 9 && month <= 11) season = 'Spring';
      else season = 'Summer';
    }
    
    return {
      location: location,
      temperature: {
        average: `${avgTemp.toFixed(1)}°C`,
        min: `${minTemp.toFixed(1)}°C`,
        max: `${maxTemp.toFixed(1)}°C`,
      },
      conditions: current.condition.text,
      season: season,
      icon: current.condition.icon,
      forecasts: forecast.map((day: any) => ({
        date: day.date,
        maxTemp: `${day.day.maxtemp_c.toFixed(1)}°C`,
        minTemp: `${day.day.mintemp_c.toFixed(1)}°C`,
        condition: day.day.condition.text,
        icon: day.day.condition.icon
      }))
    };
  }
}

export const weatherService = new WeatherService();