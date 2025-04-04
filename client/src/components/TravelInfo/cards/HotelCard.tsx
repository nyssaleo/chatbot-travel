import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Wifi, Coffee, Dumbbell } from 'lucide-react';

interface HotelCardProps {
  hotel: {
    id: string;
    name: string;
    description?: string;
    address: string;
    price: {
      amount: number;
      currency: string;
    };
    rating: number;
    amenities: string[];
    imageUrl?: string;
  };
  className?: string;
}

export function HotelCard({ hotel, className }: HotelCardProps) {
  // Function to render amenity icon
  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) {
      return <Wifi className="h-3.5 w-3.5" />;
    } else if (lowerAmenity.includes('breakfast') || lowerAmenity.includes('dining')) {
      return <Coffee className="h-3.5 w-3.5" />;
    } else if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness')) {
      return <Dumbbell className="h-3.5 w-3.5" />;
    }
    return null;
  };

  return (
    <Card className={`${className} backdrop-blur-md bg-white/30 dark:bg-gray-900/30 border-none shadow-md overflow-hidden w-full hover:shadow-lg transition-all`}>
      <div className="flex flex-col md:flex-row">
        {hotel.imageUrl && (
          <div className="md:w-1/3 h-36 md:h-auto relative">
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url(${hotel.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
          </div>
        )}
        
        <CardContent className={`p-4 flex-1 ${!hotel.imageUrl ? 'w-full' : 'md:w-2/3'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{hotel.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{hotel.address}</span>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
              {Array(Math.floor(hotel.rating)).fill(0).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" />
              ))}
              {hotel.rating % 1 > 0 && (
                <Star className="h-3 w-3 fill-current opacity-50" />
              )}
            </Badge>
          </div>
          
          {hotel.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{hotel.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            {hotel.amenities.slice(0, 4).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                {getAmenityIcon(amenity)}
                {amenity}
              </Badge>
            ))}
            {hotel.amenities.length > 4 && (
              <Badge variant="secondary" className="text-xs">+{hotel.amenities.length - 4} more</Badge>
            )}
          </div>
          
          <div className="text-right mt-2">
            <div className="text-lg font-bold">
              {hotel.price.amount.toLocaleString()} {hotel.price.currency}
            </div>
            <div className="text-xs text-muted-foreground">per night</div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}