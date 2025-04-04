import { useState, useEffect, useRef } from 'react';
import ChatContainer from '@/components/Chat/ChatContainer';
import MapContainer from '@/components/Map/MapContainer';
import { Message, Location, MapMarker, Itinerary, Weather } from '@/lib/types';
import { getChatHistory } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import InfoColumn from '../components/TravelInfo/InfoColumn';
import SocialColumn from '../components/Social/SocialColumn';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [selectedTab, setSelectedTab] = useState('chat'); // 'chat', 'info', 'social'
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

  // Mobile navigation component
  const MobileNavigation = () => (
    <div className="lg:hidden w-full flex items-center justify-around glass-darker p-2 rounded-lg mb-4">
      <button 
        onClick={() => setSelectedTab('chat')}
        className={`flex items-center justify-center p-2 rounded-lg ${selectedTab === 'chat' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
      >
        <i className="fas fa-comment-alt mr-2"></i>
        <span>Chat</span>
      </button>
      <button 
        onClick={() => setSelectedTab('info')}
        className={`flex items-center justify-center p-2 rounded-lg ${selectedTab === 'info' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
      >
        <i className="fas fa-info-circle mr-2"></i>
        <span>Travel Info</span>
      </button>
      <button 
        onClick={() => setSelectedTab('social')}
        className={`flex items-center justify-center p-2 rounded-lg ${selectedTab === 'social' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
      >
        <i className="fas fa-users mr-2"></i>
        <span>Social</span>
      </button>
    </div>
  );

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
      
      <MobileNavigation />
      
      <main className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden">
        {/* Chat Interface - 1/3 width on desktop, full on mobile when selected */}
        <div className={`
          ${selectedTab === 'chat' ? 'flex' : 'hidden'} 
          lg:flex flex-1 lg:w-1/3 lg:flex-[1] transition-all
        `}>
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
        
        {/* Travel Information Column - 1/3 width on desktop, full on mobile when selected */}
        <div className={`
          ${selectedTab === 'info' ? 'flex' : 'hidden'} 
          lg:flex flex-1 lg:w-1/3 lg:flex-[1] transition-all
        `}>
          <InfoColumn 
            currentLocation={currentLocation}
            weather={weather}
            markers={markers}
            itinerary={itinerary}
          />
        </div>
        
        {/* Social & Integrations Column - 1/3 width on desktop, full on mobile when selected */}
        <div className={`
          ${selectedTab === 'social' ? 'flex' : 'hidden'} 
          lg:flex flex-1 lg:w-1/3 lg:flex-[1] transition-all
        `}>
          <SocialColumn 
            currentLocation={currentLocation}
          />
        </div>
      </main>
      
      {/* Bottom Map Area - Hidden on mobile, shown on all desktop layouts */}
      <div className="hidden lg:block h-80 mt-4">
        <MapContainer 
          markers={markers}
          currentLocation={currentLocation}
          weather={weather}
        />
      </div>
    </div>
  );
}
