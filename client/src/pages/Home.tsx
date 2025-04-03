import { useState, useEffect, useRef } from 'react';
import ChatContainer from '@/components/Chat/ChatContainer';
import MapContainer from '@/components/Map/MapContainer';
import { Message, Location, MapMarker, Itinerary, Weather } from '@/lib/types';
import { getChatHistory } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load initial welcome message
    const initialMessage: Message = {
      id: 'initial',
      role: 'assistant',
      content: "Hello! I'm your travel planning assistant. Where would you like to go?",
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Load chat history
    const loadHistory = async () => {
      try {
        const history = await getChatHistory();
        if (history.length > 0) {
          setMessages(prev => [...prev, ...history]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    
    loadHistory();
  }, []);

  // Handle locations coming from the chat API
  const handleLocationsUpdate = (locations: Location[]) => {
    if (!locations || locations.length === 0) return;
    
    // Set current location based on first location
    if (locations[0].name) {
      setCurrentLocation(locations[0].name);
    }
    
    // Convert to map markers
    const newMarkers = locations.map(loc => ({
      id: loc.id,
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      name: loc.name,
      type: loc.locationType
    }));
    
    setMarkers(newMarkers);
  };

  // Handle new itinerary data
  const handleItineraryUpdate = (newItinerary: Itinerary | null) => {
    if (newItinerary) {
      setItinerary(newItinerary);
    }
  };

  // Handle weather updates
  const handleWeatherUpdate = (newWeather: Weather | null) => {
    if (newWeather) {
      setWeather(newWeather);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 lg:p-6 overflow-hidden">
      <header className="glass flex items-center justify-between mb-6 p-3 lg:p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <i className="fas fa-plane-departure text-primary text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Traveler<span className="text-primary">AI</span></h1>
            <p className="text-xs text-muted-foreground">Your personal travel planning assistant</p>
          </div>
        </div>
        
        {currentLocation && (
          <div className="hidden md:flex items-center glass-darker px-5 py-2 rounded-full">
            <i className="fas fa-map-marker-alt text-primary mr-2"></i>
            <span className="font-medium">{currentLocation}</span>
            {weather && (
              <div className="flex items-center ml-3 pl-3 border-l border-muted">
                <span className="text-xl mr-1">{weather.icon}</span>
                <span className="text-sm">{weather.temperature.average}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="glass-lighter px-4 py-2 rounded-full text-sm flex items-center space-x-2 hover-lift cursor-pointer">
          <i className="fas fa-user text-primary"></i>
          <span>Guest User</span>
        </div>
      </header>
      
      <main className="flex flex-col lg:flex-row flex-1 gap-5 overflow-hidden">
        {/* Chat Interface - 60% width on desktop */}
        <div className="flex-1 lg:w-3/5 lg:flex-[0.6]">
          <ChatContainer 
            messages={messages}
            setMessages={setMessages}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onLocationsUpdate={handleLocationsUpdate}
            onItineraryUpdate={handleItineraryUpdate}
            onWeatherUpdate={handleWeatherUpdate}
            itinerary={itinerary}
          />
        </div>
        
        {/* Map & Data Visualization - 40% width on desktop */}
        <div className="flex-1 lg:w-2/5 lg:flex-[0.4] flex flex-col">
          <MapContainer 
            markers={markers}
            currentLocation={currentLocation}
            weather={weather}
          />
        </div>
      </main>
    </div>
  );
}
