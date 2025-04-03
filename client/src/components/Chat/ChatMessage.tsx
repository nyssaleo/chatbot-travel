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
            {message.content}
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
