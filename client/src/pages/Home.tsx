import { useState, useEffect } from 'react';
import ChatContainer from '@/components/Chat/ChatContainer';
import MapContainer from '@/components/Map/MapContainer';
import { Message, Location, MapMarker, Itinerary, Weather, LocalFood, LocalAttraction } from '@/lib/types';
import { getChatHistory, clearChatHistory } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import InfoColumn from '../components/TravelInfo/InfoColumn';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [localFood, setLocalFood] = useState<LocalFood[]>([]);
  const [localAttractions, setLocalAttractions] = useState<LocalAttraction[]>([]);
  const [selectedTab, setSelectedTab] = useState('chat'); // 'chat', 'info'
  const { toast } = useToast();

  // Start a new chat and reset all data
  const startNewChat = async () => {
    // Reset UI state
    const initialMessage: Message = {
      id: 'initial',
      role: 'assistant',
      content: "Hello! I'm your travel planning assistant. Where would you like to go?",
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    setMarkers([]);
    setCurrentLocation('');
    setItinerary(null);
    setWeather(null);
    setLocalFood([]);
    setLocalAttractions([]);
    
    // Clear chat history on the server
    try {
      await clearChatHistory();
      
      toast({
        title: "New conversation started",
        description: "All previous data has been cleared.",
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      
      toast({
        title: "New conversation started",
        description: "Your data has been cleared locally.",
        variant: "default",
        duration: 3000
      });
    }
  };

  // Export itinerary to PDF
  const exportItineraryToPdf = () => {
    if (!itinerary) {
      toast({
        title: "No itinerary available",
        description: "Please create an itinerary first.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    // Import jsPDF dynamically to reduce initial load time
    import('jspdf').then(({ default: jsPDF }) => {
      try {
        // Create a new PDF document
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.setTextColor(0, 102, 204);
        doc.text(`Travel Itinerary: ${itinerary.destination}`, 20, 20);
        
        // Add metadata line
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        const daysText = itinerary.days.length > 1 
          ? `${itinerary.days.length} Days` 
          : '1 Day';
        doc.text(`${daysText} • ${itinerary.title}`, 20, 30);
        
        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 35, 190, 35);
        
        // Current position tracker
        let yPos = 45;
        
        // Add each day's activities
        itinerary.days.forEach((day, index) => {
          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          // Day header
          doc.setFontSize(16);
          doc.setTextColor(0, 102, 204);
          doc.text(`Day ${day.day}: ${day.title}`, 20, yPos);
          yPos += 10;
          
          // Activities
          day.activities.forEach((activity) => {
            // Check if we need a new page
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`${activity.time}`, 20, yPos);
            
            // Activity description
            doc.setTextColor(60, 60, 60);
            
            // Handle long descriptions by wrapping text
            const splitText = doc.splitTextToSize(activity.description, 150);
            doc.text(splitText, 50, yPos);
            
            // Adjust yPos based on how many lines were added
            yPos += 5 + (splitText.length * 5);
          });
          
          // Add spacing between days
          yPos += 10;
        });
        
        // Add footer with date
        const today = new Date().toLocaleDateString();
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${today} by TravelerAI`, 20, 280);
        
        // Save the PDF
        doc.save(`${itinerary.destination}_Itinerary.pdf`);
        
        toast({
          title: "Itinerary downloaded",
          description: `Your ${itinerary.destination} itinerary has been saved as PDF.`,
          duration: 3000
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error exporting PDF",
          description: "Failed to generate PDF. Please try again later.",
          variant: "destructive",
          duration: 3000
        });
      }
    }).catch(error => {
      console.error('Error loading jsPDF:', error);
      toast({
        title: "Error exporting PDF",
        description: "Failed to load PDF generation library.",
        variant: "destructive",
        duration: 3000
      });
    });
  };

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
  
  // Handle local food updates
  const handleLocalFoodUpdate = (newLocalFood: LocalFood[] | undefined) => {
    if (newLocalFood && newLocalFood.length > 0) {
      setLocalFood(newLocalFood);
    }
  };
  
  // Handle local attractions updates
  const handleLocalAttractionsUpdate = (newLocalAttractions: LocalAttraction[] | undefined) => {
    if (newLocalAttractions && newLocalAttractions.length > 0) {
      setLocalAttractions(newLocalAttractions);
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
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={startNewChat}
            variant="outline" 
            className="glass-btn flex items-center gap-2 mr-2"
            size="sm"
          >
            <i className="fas fa-plus-circle"></i>
            <span>New Chat</span>
          </Button>
          
          <Button 
            onClick={exportItineraryToPdf}
            variant="outline" 
            className={`glass-btn flex items-center gap-2 ${!itinerary ? 'opacity-50 cursor-not-allowed' : ''}`}
            size="sm"
            disabled={!itinerary}
          >
            <i className="fas fa-file-pdf"></i>
            <span>Export PDF</span>
          </Button>
        </div>
      </header>
      
      <MobileNavigation />
      
      <main className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden">
        {/* Chat Interface - half width on desktop, full on mobile when selected */}
        <div className={`
          ${selectedTab === 'chat' ? 'flex' : 'hidden'} 
          lg:flex flex-1 lg:w-1/2 transition-all
        `}>
          <ChatContainer 
            messages={messages}
            setMessages={setMessages}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onLocationsUpdate={handleLocationsUpdate}
            onItineraryUpdate={handleItineraryUpdate}
            onWeatherUpdate={handleWeatherUpdate}
            onLocalFoodUpdate={handleLocalFoodUpdate}
            onLocalAttractionsUpdate={handleLocalAttractionsUpdate}
            itinerary={itinerary}
          />
        </div>
        
        {/* Travel Information Column - half width on desktop, full on mobile when selected */}
        <div className={`
          ${selectedTab === 'info' ? 'flex' : 'hidden'} 
          lg:flex flex-1 lg:w-1/2 transition-all
        `}>
          <InfoColumn 
            currentLocation={currentLocation}
            weather={weather}
            markers={markers}
            itinerary={itinerary}
            localFood={localFood}
            localAttractions={localAttractions}
          />
        </div>
      </main>
      
      {/* Collapsible Map in Corner - Show on all layouts */}
      <div className="fixed bottom-4 right-4 z-50 shadow-xl rounded-lg overflow-hidden">
        <MapContainer 
          markers={markers}
          currentLocation={currentLocation}
          weather={weather}
          isCollapsible={true}
        />
      </div>
    </div>
  );
}
