import React from 'react';
import { Weather, MapMarker } from '@/lib/types';
import { Badge } from "@/components/ui/badge";

interface InfoCardsProps {
  weather: Weather | null;
  foodPlaces: MapMarker[];
}

const InfoCards: React.FC<InfoCardsProps> = ({ weather, foodPlaces }) => {
  return (
    <div className="space-y-3">
      {weather && (
        <div className="glass-lighter p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className={`fas fa-${weather.icon} text-xl mr-2 text-primary`}></i>
              <div>
                <div className="text-sm font-medium">{weather.temperature.average}</div>
                <div className="text-xs text-muted-foreground">{weather.conditions}</div>
              </div>
            </div>
            
            <div className="text-xs text-right">
              <div>High: {weather.temperature.max}</div>
              <div>Low: {weather.temperature.min}</div>
            </div>
          </div>
        </div>
      )}
      
      {foodPlaces.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top Places to Eat</h4>
          
          {foodPlaces.map(place => (
            <div key={place.id} className="glass-lighter p-2 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-sm">{place.name}</div>
                <div className="flex items-center mt-0.5">
                  {Array(5).fill(0).map((_, i) => (
                    <i 
                      key={i} 
                      className={`fas fa-star text-[10px] ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                    ></i>
                  ))}
                  <span className="text-xs ml-1 text-muted-foreground">4.2</span>
                </div>
              </div>
              
              <Badge className="bg-blue-500/10 text-blue-400 text-xs">
                <i className="fas fa-map-marker-alt mr-1.5"></i> 0.3 mi
              </Badge>
            </div>
          ))}
          
          {foodPlaces.length === 0 && (
            <div className="text-center py-3 text-sm text-muted-foreground">
              No restaurants found nearby.
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
        <div className="flex items-center">
          <i className="fas fa-walking mr-1.5"></i>
          <span>Walkable area</span>
        </div>
        
        <div className="flex items-center">
          <i className="fas fa-subway mr-1.5"></i>
          <span>Good public transit</span>
        </div>
      </div>
    </div>
  );
};

export default InfoCards;