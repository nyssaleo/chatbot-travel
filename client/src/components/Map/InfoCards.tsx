import { Weather, MapMarker } from '@/lib/types';
import { useState } from 'react';

interface InfoCardsProps {
  weather: Weather | null;
  foodPlaces: MapMarker[];
}

const InfoCards: React.FC<InfoCardsProps> = ({ weather, foodPlaces }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'food' | 'weather'>('overview');
  
  return (
    <div className="border-t border-[rgba(255,255,255,0.07)] glass-darker">
      {/* Tab navigation */}
      <div className="flex border-b border-[rgba(255,255,255,0.07)]">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`flex-1 py-2.5 text-sm font-medium text-center transition-all ${
            activeTab === 'overview' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <i className="fas fa-info-circle mr-1.5"></i>
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('weather')} 
          className={`flex-1 py-2.5 text-sm font-medium text-center transition-all ${
            activeTab === 'weather' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <i className="fas fa-cloud-sun mr-1.5"></i>
          Weather
        </button>
        <button 
          onClick={() => setActiveTab('food')} 
          className={`flex-1 py-2.5 text-sm font-medium text-center transition-all ${
            activeTab === 'food' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-white'
          }`}
          disabled={foodPlaces.length === 0}
        >
          <i className="fas fa-utensils mr-1.5"></i>
          Food
        </button>
      </div>
      
      {/* Content area */}
      <div className="p-4 overflow-y-auto max-h-48">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-3 animate-appear">
            {/* Weather Summary Card */}
            {weather && (
              <div className="weather-card hover-lift cursor-pointer">
                <div className="flex justify-center items-center w-12 h-12 bg-primary/20 backdrop-blur-sm rounded-lg mr-2">
                  <span className="text-2xl">{weather.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <i className="fas fa-map-marker-alt text-primary text-xs"></i>
                    {weather.location}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">{weather.conditions}</p>
                    <p className="text-xs font-medium">{weather.temperature.average}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Places Summary */}
            {foodPlaces.length > 0 && (
              <div className="glass-lighter p-3 rounded-lg hover-lift cursor-pointer">
                <div className="flex items-center mb-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[rgba(255,112,67,0.2)]">
                    <i className="fas fa-utensils text-[rgba(255,112,67,0.9)]"></i>
                  </div>
                  <h3 className="text-sm font-medium ml-2">
                    {foodPlaces.length} Food {foodPlaces.length === 1 ? 'Destination' : 'Destinations'}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {foodPlaces.slice(0, 2).map((place) => (
                    <div key={place.id} className="text-xs p-2 rounded glass-darker truncate">
                      {place.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Empty state */}
            {!weather && foodPlaces.length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <i className="fas fa-map-marked-alt text-primary"></i>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask about a destination to see information here
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Weather Tab */}
        {activeTab === 'weather' && (
          <div className="animate-appear">
            {weather ? (
              <div className="space-y-3">
                <div className="glass-lighter p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Weather in {weather.location}</h3>
                    <span className="text-2xl">{weather.icon}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{weather.conditions}</p>
                  
                  {/* Temperature display with gradient bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Min: {weather.temperature.min || 'N/A'}</span>
                      <span>Max: {weather.temperature.max || 'N/A'}</span>
                    </div>
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-green-400 to-red-500 rounded-full"></div>
                  </div>
                  
                  {/* Additional weather details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <i className="fas fa-temperature-high text-primary mr-2"></i>
                      <span>Avg: {weather.temperature.average}</span>
                    </div>
                    {weather.season && (
                      <div className="flex items-center">
                        <i className="fas fa-calendar-alt text-primary mr-2"></i>
                        <span>Season: {weather.season}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Packing suggestions based on weather */}
                <div className="glass-darker p-3 rounded-lg">
                  <h4 className="text-xs font-medium mb-2 flex items-center">
                    <i className="fas fa-suitcase text-primary mr-1.5"></i>
                    Packing Suggestions
                  </h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {weather.conditions.toLowerCase().includes('rain') && (
                      <li className="flex items-center">
                        <i className="fas fa-check text-xs text-primary mr-1.5"></i>
                        Umbrella or raincoat
                      </li>
                    )}
                    {weather.conditions.toLowerCase().includes('hot') || 
                     parseInt(weather.temperature.average) > 25 ? (
                      <>
                        <li className="flex items-center">
                          <i className="fas fa-check text-xs text-primary mr-1.5"></i>
                          Light, breathable clothing
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-check text-xs text-primary mr-1.5"></i>
                          Sunscreen and sunglasses
                        </li>
                      </>
                    ) : weather.conditions.toLowerCase().includes('cold') || 
                         parseInt(weather.temperature.average) < 10 ? (
                      <>
                        <li className="flex items-center">
                          <i className="fas fa-check text-xs text-primary mr-1.5"></i>
                          Warm layers and jacket
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-check text-xs text-primary mr-1.5"></i>
                          Hat and gloves
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center">
                          <i className="fas fa-check text-xs text-primary mr-1.5"></i>
                          Light jacket or sweater for evenings
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-check text-xs text-primary mr-1.5"></i>
                          Comfortable walking shoes
                        </li>
                      </>
                    )}
                    <li className="flex items-center">
                      <i className="fas fa-check text-xs text-primary mr-1.5"></i>
                      Travel adapter and essentials
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <i className="fas fa-cloud-sun text-primary text-xl"></i>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask about the weather in a specific location
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Food Tab */}
        {activeTab === 'food' && (
          <div className="animate-appear">
            {foodPlaces.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <i className="fas fa-utensils text-primary mr-2"></i>
                  Popular Dining Options
                </h3>
                
                <div className="space-y-3">
                  {foodPlaces.map((place) => (
                    <div key={place.id} className="location-card flex items-start">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(255,112,67,0.2)] mr-3 flex-shrink-0">
                        <i className="fas fa-utensils text-[rgba(255,112,67,0.9)]"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{place.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          <span className="truncate">
                            {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                          </span>
                        </p>
                      </div>
                      <button className="ml-2 w-8 h-8 rounded-full glass-lighter flex items-center justify-center hover:bg-primary/20 transition-colors">
                        <i className="fas fa-directions text-primary text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <i className="fas fa-utensils text-primary text-xl"></i>
                </div>
                <p className="text-sm text-muted-foreground">
                  No dining options found for this location yet
                </p>
                <button className="mt-3 text-xs text-primary hover:underline">
                  Ask about restaurants
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCards;
