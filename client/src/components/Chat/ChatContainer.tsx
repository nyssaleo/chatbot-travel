import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import { Message, Location, Itinerary, Weather, LocalFood, LocalAttraction } from '@/lib/types';
import { sendMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChatContainerProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onLocationsUpdate: (locations: Location[]) => void;
  onItineraryUpdate: (itinerary: Itinerary | null) => void;
  onWeatherUpdate: (weather: Weather | null) => void;
  onLocalFoodUpdate?: (localFood: LocalFood[]) => void;
  onLocalAttractionsUpdate?: (localAttractions: LocalAttraction[]) => void;
  itinerary: Itinerary | null;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  setMessages,
  isLoading,
  setIsLoading,
  onLocationsUpdate,
  onItineraryUpdate,
  onWeatherUpdate,
  onLocalFoodUpdate,
  onLocalAttractionsUpdate,
  itinerary
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom of chat container when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText: string) => {
    if (messageText.trim() === '') return;
    
    // Add user message to messages
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await sendMessage(messageText);
      
      // Add assistant message to messages
      setMessages(prev => [...prev, response.message]);
      
      // Process location data if available
      if (response.locations && response.locations.length > 0) {
        onLocationsUpdate(response.locations);
      }
      
      // Process itinerary data if available
      if (response.itinerary) {
        onItineraryUpdate(response.itinerary);
      }
      
      // Process weather data if available
      if (response.weather) {
        onWeatherUpdate(response.weather);
      }
      
      // Process local food data if available
      if (response.localFood && response.localFood.length > 0 && onLocalFoodUpdate) {
        onLocalFoodUpdate(response.localFood);
      }
      
      // Process local attractions data if available
      if (response.localAttractions && response.localAttractions.length > 0 && onLocalAttractionsUpdate) {
        onLocalAttractionsUpdate(response.localAttractions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to my services. Please try again in a moment.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass flex-1 flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center mr-3">
              <i className="fas fa-robot text-primary"></i>
            </div>
            <h2 className="text-lg font-medium text-white">Travel Assistant</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online
            </div>
            
            <button className="glass-lighter p-1.5 rounded-lg hover:bg-opacity-30 transition-all">
              <i className="fas fa-trash-alt text-xs text-muted-foreground hover:text-primary transition-colors"></i>
            </button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          Ask about destinations, itineraries, weather, or local recommendations
        </p>
        
        {itinerary && (
          <div className="mt-3 glass-darker p-2 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-route text-primary mr-2"></i>
              <span className="text-sm">{itinerary.title}</span>
            </div>
            <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
              {itinerary.days.length} {itinerary.days.length === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        )}
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4"
        id="chat-container"
      >
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            itinerary={message.role === 'assistant' && itinerary ? itinerary : null}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
      </div>
      
      <div className="p-4 pb-5 border-t border-[rgba(255,255,255,0.07)] bg-[rgba(25,25,35,0.3)]">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
          <div className="flex items-center">
            <i className="fas fa-info-circle text-primary mr-1.5"></i>
            <span>Try asking about: </span>
          </div>
          
          <div className="flex gap-2">
            <button className="glass-darker px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">
              Tokyo
            </button>
            <button className="glass-darker px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">
              Paris
            </button>
            <button className="glass-darker px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">
              New York
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
