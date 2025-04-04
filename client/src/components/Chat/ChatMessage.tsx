import { useState } from 'react';
import { Message, Itinerary } from '@/lib/types';
import ItineraryCard from '../Itinerary/ItineraryCard';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  itinerary: Itinerary | null;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, itinerary }) => {
  const isUser = message.role === 'user';
  const [showTimestamp, setShowTimestamp] = useState(false);
  
  // Format timestamp (like "2 minutes ago")
  const formattedTime = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });
  
  // Check if message contains a file reference - often found when the model returns large chunks of text
  const containsFileReference = !isUser && message.content.includes('Pasted-') && message.content.includes('.txt');
  
  // Generate a concise summary if the message has an itinerary
  const renderContent = () => {
    // If user message, just show it
    if (isUser) {
      return message.content;
    }
    
    // For assistant messages
    if (itinerary) {
      if (containsFileReference) {
        return `Here's your ${itinerary.days.length}-day itinerary for ${itinerary.destination}. Explore the details below!`;
      } else {
        // If message is less than 400 characters and doesn't contain file reference, keep original
        if (message.content.length < 400 && !message.content.includes('Your Destination Itinerary')) {
          return message.content;
        }
        return `I've created a ${itinerary.days.length}-day itinerary for ${itinerary.destination}. Check out the details below!`;
      }
    }
    
    // For regular assistant message (no itinerary)
    if (containsFileReference) {
      // Extract first sentence or use generic message
      const firstSentence = message.content.split('.')[0];
      if (firstSentence && firstSentence.length < 100) {
        return firstSentence + '.';
      }
      return 'Here are some travel suggestions based on your request!';
    }
    
    return message.content;
  };

  return (
    <div 
      className={`flex group items-start ${isUser ? 'justify-end' : ''} mb-4 animate-appear`}
      onClick={() => setShowTimestamp(!showTimestamp)}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1 shadow-sm">
          <i className="fas fa-robot text-primary"></i>
        </div>
      )}
      
      <div className="flex flex-col max-w-[85%]">
        <div className={`
          ${isUser ? 'user-bubble shadow-md' : 'glass-message'} 
          p-3.5 rounded-2xl 
          ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}
          ${itinerary ? 'space-y-3' : ''}
          transition-all duration-200
        `}>
          <div className={`leading-relaxed ${isUser ? 'text-rich-black' : 'text-white'} text-sm`}>
            {renderContent()}
          </div>
          
          {itinerary && (
            <div className="mt-3 border-t border-[rgba(255,255,255,0.1)] pt-3">
              <ItineraryCard itinerary={itinerary} />
            </div>
          )}
        </div>
        
        {/* Timestamp tooltip */}
        <div className={`
          text-[10px] text-muted-foreground px-2 mt-1 
          ${isUser ? 'self-end' : 'self-start'}
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${showTimestamp ? '!opacity-100' : ''}
        `}>
          {formattedTime}
        </div>
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-2 mt-1 shadow-sm">
          <i className="fas fa-user text-white"></i>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
