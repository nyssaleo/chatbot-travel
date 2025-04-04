import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudRain, Sun, CloudSun, Snowflake, ThermometerSun, ThermometerSnowflake, Wind } from 'lucide-react';
import { Weather } from '@/lib/types';

interface WeatherCardProps {
  weather: Weather;
  className?: string;
}

export function WeatherCard({ weather, className }: WeatherCardProps) {
  // Helper to get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    } else if (lowerCondition.includes('sun') && lowerCondition.includes('cloud')) {
      return <CloudSun className="h-6 w-6 text-amber-500" />;
    } else if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return <Sun className="h-6 w-6 text-amber-500" />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud className="h-6 w-6 text-gray-500" />;
    } else if (lowerCondition.includes('snow') || lowerCondition.includes('ice')) {
      return <Snowflake className="h-6 w-6 text-blue-300" />;
    } else {
      return <CloudSun className="h-6 w-6 text-amber-500" />;
    }
  };

  // Helper to get season color
  const getSeasonColor = (season?: string) => {
    if (!season) return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    
    const lowerSeason = season.toLowerCase();
    if (lowerSeason.includes('summer')) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    } else if (lowerSeason.includes('spring')) {
      return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    } else if (lowerSeason.includes('fall') || lowerSeason.includes('autumn')) {
      return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    } else if (lowerSeason.includes('winter')) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  };

  return (
    <Card className={`${className} backdrop-blur-md bg-white/30 dark:bg-gray-900/30 border-none shadow-md overflow-hidden hover:shadow-lg transition-all`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">
            Weather in {weather.location}
          </CardTitle>
          {weather.season && (
            <Badge className={`${getSeasonColor(weather.season)}`}>
              {weather.season}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="mr-4">
              {weather.icon ? (
                <img src={weather.icon} alt={weather.conditions} className="w-14 h-14" />
              ) : (
                getWeatherIcon(weather.conditions)
              )}
            </div>
            <div>
              <div className="text-2xl font-bold">
                {weather.temperature.average}
              </div>
              <div className="text-muted-foreground">
                {weather.conditions}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 md:gap-4">
            <div className="text-center p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
              <div className="flex justify-center mb-1">
                <ThermometerSnowflake className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-sm font-medium">Min</div>
              <div className="text-lg">{weather.temperature.min}</div>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/20">
              <div className="flex justify-center mb-1">
                <ThermometerSun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-sm font-medium">Max</div>
              <div className="text-lg">{weather.temperature.max}</div>
            </div>
          </div>
        </div>
        
        {/* If we have forecast data, show a 3-day forecast */}
        {weather.forecasts && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-3 gap-2">
              {weather.forecasts.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground">{day.date}</div>
                  <div className="my-1">
                    {day.icon ? (
                      <img src={day.icon} alt={day.condition} className="w-8 h-8 mx-auto" />
                    ) : (
                      <div className="flex justify-center">
                        {getWeatherIcon(day.condition)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs">
                    <span className="text-blue-600 dark:text-blue-400">{day.minTemp}</span>
                    {' - '}
                    <span className="text-amber-600 dark:text-amber-400">{day.maxTemp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}