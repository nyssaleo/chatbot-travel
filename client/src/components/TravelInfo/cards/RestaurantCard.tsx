import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, DollarSign, UtensilsCrossed } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    cuisine: string;
    address: string;
    price: string; // Can be dollar signs ('$', '$$') or descriptive text ('$10-$15', 'Inexpensive')
    rating: number;
    openingHours?: string;
    imageUrl?: string;
    description?: string;
  };
  className?: string;
}

export function RestaurantCard({ restaurant, className }: RestaurantCardProps) {
  // Determine if the price is in dollar sign format ('$', '$$', etc.)
  const isDollarSignFormat = /^(\$+)$/.test(restaurant.price);
  
  // Convert price string to visual representation if in dollar signs format
  const renderPrice = () => {
    if (isDollarSignFormat) {
      const maxDollars = 4;
      const dollars = restaurant.price.length;
      
      return (
        <span className="flex">
          {Array(dollars).fill(0).map((_, i) => (
            <DollarSign key={i} className="h-3 w-3 fill-current" />
          ))}
          {Array(maxDollars - dollars).fill(0).map((_, i) => (
            <DollarSign key={i + dollars} className="h-3 w-3 opacity-20" />
          ))}
        </span>
      );
    } else {
      // For descriptive price text, just display the text
      return <span>{restaurant.price}</span>;
    }
  };

  return (
    <Card className={`${className} backdrop-blur-md bg-white/30 dark:bg-gray-900/30 border-none shadow-md overflow-hidden w-full hover:shadow-lg transition-all`}>
      <div className="flex flex-col md:flex-row">
        {restaurant.imageUrl && (
          <div className="md:w-1/3 h-36 md:h-auto relative">
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url(${restaurant.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
          </div>
        )}
        
        <CardContent className={`p-4 flex-1 ${!restaurant.imageUrl ? 'w-full' : 'md:w-2/3'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{restaurant.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{restaurant.address}</span>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
              {Array(Math.floor(restaurant.rating)).fill(0).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" />
              ))}
              {restaurant.rating % 1 > 0 && (
                <Star className="h-3 w-3 fill-current opacity-50" />
              )}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              {restaurant.cuisine}
            </Badge>
            
            {restaurant.openingHours && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {restaurant.openingHours}
              </Badge>
            )}
          </div>
          
          {restaurant.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{restaurant.description}</p>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm flex items-center">
              <span className="text-muted-foreground mr-1">Price:</span>
              {renderPrice()}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                Open Now
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}