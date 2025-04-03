import { Weather, MapMarker } from '@/lib/types';

interface InfoCardsProps {
  weather: Weather | null;
  foodPlaces: MapMarker[];
}

const InfoCards: React.FC<InfoCardsProps> = ({ weather, foodPlaces }) => {
  return (
    <div className="p-4 overflow-y-auto max-h-48">
      <div className="space-y-3">
        {/* Weather Card */}
        {weather && (
          <div className="glass-lighter p-3 rounded-lg flex items-center justify-between expand">
            <div>
              <h3 className="text-white font-medium">Weather in {weather.location}</h3>
              <p className="text-[#C4C4C4] text-sm">
                {weather.temperature.average}
              </p>
            </div>
            <div className="text-right">
              <div className="text-white text-xl">{weather.icon}</div>
              <div className="text-[#88CCEE] text-sm">{weather.conditions}</div>
            </div>
          </div>
        )}
        
        {/* Default Weather for Tokyo during development */}
        {!weather && (
          <div className="glass-lighter p-3 rounded-lg flex items-center justify-between expand">
            <div>
              <h3 className="text-white font-medium">Weather information</h3>
              <p className="text-[#C4C4C4] text-sm">Select a destination for weather details</p>
            </div>
            <div className="text-right">
              <div className="text-white text-xl">🌤️</div>
              <div className="text-[#88CCEE] text-sm">Weather data</div>
            </div>
          </div>
        )}
        
        {/* Food Places Card */}
        {foodPlaces.length > 0 && (
          <div className="glass-lighter p-3 rounded-lg expand">
            <h3 className="text-white font-medium mb-2">Popular Food Destinations</h3>
            <div className="grid grid-cols-2 gap-2">
              {foodPlaces.map((place) => (
                <div key={place.id} className="flex items-center space-x-2 p-2 rounded glass-darker">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#88CCEE] bg-opacity-20">
                    <i className="fas fa-utensils text-xs text-[#88CCEE]"></i>
                  </div>
                  <span className="text-sm text-white truncate">{place.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCards;
