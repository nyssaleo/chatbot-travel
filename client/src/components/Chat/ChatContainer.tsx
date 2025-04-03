import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import { Message, Location, Itinerary, Weather } from '@/lib/types';
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
    <div className="glass flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[rgba(255,255,255,0.2)]">
        <h2 className="text-lg font-medium text-white">Travel Assistant</h2>
        <p className="text-sm text-[#C4C4C4]">Ask me about destinations, itineraries, or travel recommendations</p>
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
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatContainer;
