import React, { useState, useEffect } from 'react';
import { Itinerary } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ItineraryCardProps {
  itinerary: Itinerary;
  onDayChange?: (day: number) => void;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary, onDayChange }) => {
  const [activeDay, setActiveDay] = useState(1);
  
  const selectedDay = itinerary.days.find(day => day.day === activeDay) || itinerary.days[0];
  
  // Extract location from activity description for map viewing
  const extractLocation = (description: string): string | null => {
    // Look for specific place names in the text
    const locationPatterns = [
      /visit ([\w\s-]+)/i, 
      /explore ([\w\s-]+)/i,
      /at ([\w\s-]+)/i,
      /to ([\w\s-]+)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        // Check if it's not a generic word like "the" or "a"
        if (match[1].length > 3 && !['the', 'this', 'that', 'there'].includes(match[1].toLowerCase().trim())) {
          return match[1].trim();
        }
      }
    }
    
    // If no specific matches were found, and description is short enough, use it as location
    if (description.length < 50 && description.split(' ').length < 6) {
      return description.trim();
    }
    
    return null;
  };
  
  // Handle day change and notify parent component
  const handleDayChange = (day: number) => {
    setActiveDay(day);
    if (onDayChange) {
      onDayChange(day);
    }
  };
  
  // Trigger onDayChange when component mounts
  useEffect(() => {
    if (onDayChange) {
      onDayChange(activeDay);
    }
  }, []);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-base">{itinerary.title}</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <i className="fas fa-download mr-1.5"></i> Export
        </Button>
      </div>
      
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {itinerary.days.map(day => (
          <Button 
            key={day.day}
            size="sm" 
            variant={activeDay === day.day ? "default" : "outline"} 
            className={`h-7 text-xs ${activeDay === day.day ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}
            onClick={() => handleDayChange(day.day)}
          >
            Day {day.day}
          </Button>
        ))}
      </div>
      
      <div className="glass-lighter p-3 rounded-lg">
        <div className="flex items-center text-sm font-medium mb-2">
          <i className="fas fa-calendar-day text-primary mr-2"></i>
          {selectedDay.title}
        </div>
        
        <div className="space-y-3">
          {selectedDay.activities.map((activity, index) => {
            const location = extractLocation(activity.description);
            const hasLocation = !!location;
            
            return (
              <div key={index} className="flex items-start">
                <div className="flex flex-col items-center mr-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] relative z-10">
                    <i className="fas fa-clock"></i>
                  </div>
                  {index < selectedDay.activities.length - 1 && (
                    <div className="w-0.5 h-full bg-primary/20 mt-1"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium">{activity.time}</span>
                    <Badge variant="outline" className="h-5 text-[10px] bg-primary/10 text-primary">
                      {index % 3 === 0 ? 'Attraction' : index % 3 === 1 ? 'Food' : 'Transport'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm">{activity.description}</p>
                    {hasLocation && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="ml-2 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                              onClick={() => {
                                // Send message to parent component to show on map
                                window.dispatchEvent(new CustomEvent('showOnMap', { 
                                  detail: { 
                                    location: `${location}, ${itinerary.destination}`,
                                    name: location,
                                    type: index % 3 === 0 ? 'attraction' : index % 3 === 1 ? 'food' : 'transport',
                                    day: activeDay
                                  }
                                }));
                              }}
                            >
                              <i className="fas fa-map-marker-alt text-xs"></i>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Show on map</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {index < selectedDay.activities.length - 1 && <Separator className="mt-2" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center">
          <i className="fas fa-map-marker-alt mr-1.5"></i>
          <span>{itinerary.destination}</span>
        </div>
        
        <div className="flex items-center">
          <i className="fas fa-calendar-alt mr-1.5"></i>
          <span>{itinerary.days.length} days</span>
        </div>
        
        <div className="flex items-center">
          <i className="fas fa-share-alt mr-1.5"></i>
          <span>Share</span>
        </div>
      </div>
    </div>
  );
};

export default ItineraryCard;