import { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize textarea as content grows
  const autoResizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  };

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          rows={1}
          className="floating-input w-full py-3 pl-12 pr-14 text-sm rounded-full resize-none focus:outline-none"
          placeholder="Ask me about destinations, itineraries, or travel tips..."
          disabled={disabled}
          style={{ minHeight: '46px', maxHeight: '120px' }}
        />

        {/* Microphone button (left side) */}
        <button
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full glass-lighter flex items-center justify-center hover:bg-primary/10 transition-colors"
          aria-label="Voice input"
        >
          <i className="fas fa-microphone text-primary"></i>
        </button>

        {/* Send button (right side) */}
        <button
          onClick={handleSend}
          disabled={disabled || message.trim() === ''}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            message.trim() && !disabled
              ? 'bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90'
              : 'glass-lighter text-muted-foreground'
          }`}
          aria-label="Send message"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
