import React from 'react';
import { Badge } from "@/components/ui/badge";

interface RestaurantCardProps {
  name: string;
  cuisine: string;
  price: string;
  rating: number;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  name,
  cuisine,
  price,
  rating
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
  
  // Function to generate a random signature dish
  const getSignatureDish = () => {
    const dishes = [
      "Signature Ramen",
      "Fresh Sushi Platter",
      "Authentic Pasta",
      "Crispy Duck",
      "Seafood Paella",
      "Traditional Curry"
    ];
    
    return dishes[Math.floor(Math.random() * dishes.length)];
  };
  
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
            <i className="fas fa-utensils text-primary"></i>
          </div>
          <div>
            <h4 className="font-medium">{name}</h4>
            <div className="flex items-center text-xs space-x-1 mt-0.5">
              {renderStars()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-primary/10 text-primary">{price}</Badge>
          <p className="text-xs mt-1">{cuisine}</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          <div className="text-sm font-medium">Popular Dishes</div>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <div className="flex items-center">
              <i className="fas fa-star-of-life text-primary text-[8px] mr-1.5"></i>
              {getSignatureDish()}
            </div>
            <div className="flex items-center">
              <i className="fas fa-star-of-life text-primary text-[8px] mr-1.5"></i>
              {getSignatureDish()}
            </div>
          </div>
        </div>
        
        <button className="glass-lighter text-sm px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors">
          Menu
        </button>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center">
          <i className="fas fa-clock text-muted-foreground mr-1.5"></i>
          <span className="text-muted-foreground">Opens 11:30 AM - 10:00 PM</span>
        </div>
        
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400">
          <i className="fas fa-utensils mr-1.5"></i> Reservations recommended
        </Badge>
      </div>
    </div>
  );
};

export default RestaurantCard;