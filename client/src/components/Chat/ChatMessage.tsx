import { Message, Itinerary } from '@/lib/types';
import ItineraryCard from '../Itinerary/ItineraryCard';

interface ChatMessageProps {
  message: Message;
  itinerary: Itinerary | null;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, itinerary }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex items-start ${isUser ? 'justify-end' : ''} mb-4 animate-appear`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full glass flex items-center justify-center mr-3 mt-1">
          <i className="fas fa-robot text-[#88CCEE]"></i>
        </div>
      )}
      
      <div className={`
        ${isUser ? 'user-bubble text-[#0A0A0A]' : 'glass-darker text-white'} 
        max-w-[80%] p-3 rounded-lg 
        ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}
        ${itinerary ? 'space-y-3' : ''}
      `}>
        <p className={isUser ? 'text-rich-black' : 'text-white'}>
          {message.content}
        </p>
        
        {itinerary && (
          <ItineraryCard itinerary={itinerary} />
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[#88CCEE] bg-opacity-80 flex items-center justify-center ml-3 mt-1">
          <i className="fas fa-user text-white"></i>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
