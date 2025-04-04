import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ActivityCardProps {
  name: string;
  type: string;
  price: string;
  duration: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  name,
  type,
  price,
  duration
}) => {
  const priceDisplay = price === 'Free' ? (
    <Badge variant="outline" className="bg-green-500/10 text-green-400">Free</Badge>
  ) : (
    <Badge className="bg-primary/10 text-primary">{price}</Badge>
  );
  
  // Function to generate the availability info
  const getAvailability = () => {
    const options = [
      "Available daily",
      "Available on weekdays",
      "Available on weekends",
      "Limited availability",
      "Book 2 days in advance"
    ];
    
    return options[Math.floor(Math.random() * options.length)];
  };
  
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
            <i className="fas fa-map-marked-alt text-primary"></i>
          </div>
          <div>
            <h4 className="font-medium">{name}</h4>
            <p className="text-xs text-muted-foreground">{type}</p>
          </div>
        </div>
        <div className="text-right">
          {priceDisplay}
          <p className="text-xs mt-1">per person</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 text-xs">
            <i className="fas fa-clock mr-1.5"></i> {duration}
          </Badge>
          
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 text-xs">
            <i className="fas fa-language mr-1.5"></i> English
          </Badge>
        </div>
        
        <button className="glass-lighter text-sm px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors">
          Book
        </button>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center">
          <i className="fas fa-calendar-alt text-muted-foreground mr-1.5"></i>
          <span className="text-muted-foreground">{getAvailability()}</span>
        </div>
        
        <div className="flex items-center">
          <i className="fas fa-users text-muted-foreground mr-1.5"></i>
          <span className="text-muted-foreground">Small groups</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;