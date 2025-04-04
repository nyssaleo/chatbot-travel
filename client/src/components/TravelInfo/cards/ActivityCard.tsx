import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Map, CalendarDays, Star, DollarSign } from 'lucide-react';

interface ActivityCardProps {
  activity: {
    id: string;
    name: string;
    type: string;
    description?: string;
    price: string;
    duration: string;
    location: string;
    rating?: number;
    availableDates?: string[];
    imageUrl?: string;
  };
  className?: string;
}

export function ActivityCard({ activity, className }: ActivityCardProps) {
  return (
    <Card className={`${className} backdrop-blur-md bg-white/30 dark:bg-gray-900/30 border-none shadow-md overflow-hidden w-full hover:shadow-lg transition-all`}>
      <div className="flex flex-col md:flex-row">
        {activity.imageUrl && (
          <div className="md:w-1/3 h-36 md:h-auto relative">
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url(${activity.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
          </div>
        )}
        
        <CardContent className={`p-4 flex-1 ${!activity.imageUrl ? 'w-full' : 'md:w-2/3'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{activity.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Map className="h-3.5 w-3.5 mr-1" />
                <span>{activity.location}</span>
              </div>
            </div>
            
            {activity.rating && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                {Array(Math.floor(activity.rating)).fill(0).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
                {activity.rating % 1 > 0 && (
                  <Star className="h-3 w-3 fill-current opacity-50" />
                )}
              </Badge>
            )}
          </div>
          
          {activity.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{activity.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {activity.duration}
            </Badge>
            
            <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400">
              {activity.type}
            </Badge>
            
            {activity.availableDates && activity.availableDates.length > 0 && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {activity.availableDates[0]}
              </Badge>
            )}
          </div>
          
          <div className="text-right mt-2">
            <div className="text-md font-bold flex items-center justify-end">
              {activity.price === 'Free' ? (
                <span className="text-green-600 dark:text-green-400">Free</span>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  {activity.price}
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">per person</div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}