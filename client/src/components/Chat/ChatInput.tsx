import { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      
      // Focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-[rgba(255,255,255,0.2)]">
      <div className="flex items-center">
        <input 
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="glass-lighter flex-1 py-3 px-4 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#88CCEE] text-white"
          placeholder="Type your travel query..."
          disabled={disabled}
        />
        <button 
          onClick={handleSend}
          disabled={disabled || message.trim() === ''}
          className="bg-[#88CCEE] hover:bg-opacity-80 text-[#0A0A0A] rounded-r-lg px-4 py-3 font-medium transition-all disabled:opacity-50"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
      <div className="flex justify-between mt-2 text-xs text-[#C4C4C4] px-1">
        <div>Try: "Show me places to visit in Tokyo"</div>
        <div>Powered by Groq AI</div>
      </div>
    </div>
  );
};

export default ChatInput;
