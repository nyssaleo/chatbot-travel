const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start mb-4 animate-appear">
      <div className="w-8 h-8 rounded-full glass flex items-center justify-center mr-3 mt-1">
        <i className="fas fa-robot text-[#88CCEE]"></i>
      </div>
      <div className="glass-darker py-3 px-4 rounded-lg rounded-tl-none">
        <div className="flex space-x-1 items-center">
          <div className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-blink"></div>
          <div className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-blink" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-[#C4C4C4] rounded-full animate-blink" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
