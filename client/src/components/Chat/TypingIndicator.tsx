const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start mb-4 animate-appear">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1 shadow-sm">
        <i className="fas fa-robot text-primary"></i>
      </div>
      
      <div className="glass-message py-3 px-5 rounded-2xl rounded-tl-sm">
        <div className="flex space-x-2 items-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-blink"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-blink" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-blink" style={{animationDelay: '0.4s'}}></div>
          </div>
          
          <span className="text-xs text-muted-foreground ml-1">Thinking...</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
