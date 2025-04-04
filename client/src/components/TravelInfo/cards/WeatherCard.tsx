import React from 'react';
import { Weather } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";

interface WeatherCardProps {
  weather: Weather;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  // Function to get weather icon class based on conditions
  const getWeatherIcon = (conditions: string) => {
    const lowerConditions = conditions.toLowerCase();
    
    if (lowerConditions.includes('sunny') || lowerConditions.includes('clear')) {
      return 'fa-sun text-yellow-400';
    } else if (lowerConditions.includes('cloud') || lowerConditions.includes('overcast')) {
      return 'fa-cloud text-gray-400';
    } else if (lowerConditions.includes('rain') || lowerConditions.includes('drizzle')) {
      return 'fa-cloud-rain text-blue-400';
    } else if (lowerConditions.includes('thunderstorm') || lowerConditions.includes('storm')) {
      return 'fa-bolt text-yellow-500';
    } else if (lowerConditions.includes('snow') || lowerConditions.includes('flurries')) {
      return 'fa-snowflake text-blue-300';
    } else if (lowerConditions.includes('fog') || lowerConditions.includes('mist')) {
      return 'fa-smog text-gray-300';
    } else if (lowerConditions.includes('wind') || lowerConditions.includes('gust')) {
      return 'fa-wind text-blue-200';
    } else {
      return 'fa-cloud-sun text-yellow-300';
    }
  };
  
  // Function to generate forecast data for the next few days
  const getForecastData = () => {
    const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const icons = ['fa-sun', 'fa-cloud-sun', 'fa-cloud', 'fa-cloud-showers-heavy', 'fa-cloud-sun'];
    const temps = [
      { min: parseInt(weather.temperature.min) - 2, max: parseInt(weather.temperature.max) - 1 },
      { min: parseInt(weather.temperature.min) - 1, max: parseInt(weather.temperature.max) + 1 },
      { min: parseInt(weather.temperature.min), max: parseInt(weather.temperature.max) + 2 },
      { min: parseInt(weather.temperature.min) + 1, max: parseInt(weather.temperature.max) },
      { min: parseInt(weather.temperature.min) - 1, max: parseInt(weather.temperature.max) - 2 }
    ];
    
    return days.slice(0, 5).map((day, index) => ({
      day,
      icon: `fas ${icons[index % icons.length]} ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}`,
      min: `${temps[index].min}°`,
      max: `${temps[index].max}°`
    }));
  };
  
  return (
    <Card className="glass-darker overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium flex items-center">
              <i className="fas fa-map-marker-alt text-primary mr-2"></i>
              {weather.location} Weather
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {weather.season ? `${weather.season} season` : 'Current conditions'}
            </p>
          </div>
          
          <div className="flex items-center p-1 px-3 glass-lighter rounded-lg">
            <span className="text-3xl mr-3">
              <i className={`fas ${getWeatherIcon(weather.conditions)}`}></i>
            </span>
            <div>
              <p className="text-xl font-bold">{weather.temperature.average}</p>
              <p className="text-xs text-muted-foreground">{weather.conditions}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-5 flex items-center justify-between">
          {getForecastData().map((forecast, index) => (
            <div key={index} className="text-center">
              <p className="text-xs font-medium">{forecast.day}</p>
              <p className="text-lg my-1">
                <i className={forecast.icon}></i>
              </p>
              <div className="flex text-xs justify-center space-x-1">
                <span className="text-blue-300">{forecast.min}</span>
                <span className="text-red-300">{forecast.max}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs glass-lighter px-3 py-2 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-tint text-blue-400 mr-1.5"></i>
            <span>Humidity: 65%</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-wind text-gray-400 mr-1.5"></i>
            <span>Wind: 8 mph</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-eye text-purple-400 mr-1.5"></i>
            <span>Visibility: Good</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;