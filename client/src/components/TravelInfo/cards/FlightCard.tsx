import React from 'react';
import { Badge } from "@/components/ui/badge";

interface FlightCardProps {
  departure: string;
  destination: string;
  price: string;
  airline: string;
  duration: string;
  stops: string;
}

const FlightCard: React.FC<FlightCardProps> = ({
  departure,
  destination,
  price,
  airline,
  duration,
  stops
}) => {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
            <i className="fas fa-plane text-primary"></i>
          </div>
          <div>
            <h4 className="font-medium">{airline}</h4>
            <p className="text-xs text-muted-foreground">Flight AF302</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">{price}</p>
          <p className="text-xs">Round trip</p>
        </div>
      </div>
      
      <div className="relative flex items-center justify-between">
        <div className="text-center">
          <p className="text-sm font-bold">{departure}</p>
          <p className="text-xs text-muted-foreground">10:30 AM</p>
        </div>
        
        <div className="flex-1 mx-2 relative">
          <div className="h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 w-full absolute top-1/2 transform -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background rounded-full p-1">
            <i className="fas fa-plane text-xs text-primary"></i>
          </div>
          <div className="text-center text-xs mt-2">{duration}</div>
        </div>
        
        <div className="text-center">
          <p className="text-sm font-bold">{destination}</p>
          <p className="text-xs text-muted-foreground">7:55 PM</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-1">
        <Badge variant="outline" className="bg-primary/10 text-xs">
          <i className="fas fa-clock text-primary mr-1.5"></i> {duration}
        </Badge>
        
        <Badge variant="outline" className={`text-xs ${stops === '0' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
          <i className={`fas ${stops === '0' ? 'fa-direct' : 'fa-exchange-alt'} mr-1.5`}></i>
          {stops === '0' ? 'Nonstop' : `${stops} Stop`}
        </Badge>
        
        <button className="glass-lighter text-sm px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors">
          Book
        </button>
      </div>
    </div>
  );
};

export default FlightCard;