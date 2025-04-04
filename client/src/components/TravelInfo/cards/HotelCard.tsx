import React from 'react';
import { Badge } from "@/components/ui/badge";

interface HotelCardProps {
  name: string;
  price: string;
  rating: number;
  neighborhood: string;
}

const HotelCard: React.FC<HotelCardProps> = ({
  name,
  price,
  rating,
  neighborhood
}) => {
  // Function to render the stars based on rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star text-yellow-400"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt text-yellow-400"></i>);
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star text-muted-foreground"></i>);
    }
    
    return stars;
  };
  
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
            <i className="fas fa-hotel text-primary"></i>
          </div>
          <div>
            <h4 className="font-medium">{name}</h4>
            <div className="flex items-center text-xs space-x-1 mt-0.5">
              {renderStars()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">{price}</p>
          <p className="text-xs">per night</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 text-xs">
            <i className="fas fa-map-marker-alt mr-1.5"></i> {neighborhood}
          </Badge>
          
          <Badge variant="outline" className="bg-green-500/10 text-green-400 text-xs">
            <i className="fas fa-wifi mr-1.5"></i> Free WiFi
          </Badge>
        </div>
        
        <button className="glass-lighter text-sm px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors">
          Book
        </button>
      </div>
      
      <div className="flex items-center text-xs text-muted-foreground">
        <i className="fas fa-check-circle text-green-400 mr-1.5"></i>
        Free cancellation available
      </div>
    </div>
  );
};

export default HotelCard;