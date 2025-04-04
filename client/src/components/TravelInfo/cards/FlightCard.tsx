import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Clock, Calendar, DollarSign, ArrowRight } from 'lucide-react';

interface FlightCardProps {
  flight: {
    id?: string;
    departure: string;
    destination: string;
    departureTime?: string;
    arrivalTime?: string;
    departureDate?: string;
    returnDate?: string;
    price: {
      amount: number;
      currency: string;
    };
    airline: string;
    flightNumber?: string;
    duration: string;
    stops: number;
    layovers?: {
      airport: string;
      duration: string;
    }[];
    aircraft?: string;
    seatsAvailable?: number;
    cabinClass?: string;
  };
  className?: string;
}

export function FlightCard({ flight, className }: FlightCardProps) {
  return (
    <Card className={`${className} backdrop-blur-md bg-white/30 dark:bg-gray-900/30 border-none shadow-md overflow-hidden w-full hover:shadow-lg transition-all`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <div className="text-lg font-bold mr-2">{flight.airline}</div>
              {flight.flightNumber && (
                <Badge variant="outline" className="text-xs">
                  {flight.flightNumber}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {flight.cabinClass || 'Economy'} • {flight.seatsAvailable ? `${flight.seatsAvailable} seats left` : 'Available'}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold flex items-center justify-end">
              <DollarSign className="h-4 w-4" />
              {flight.price.amount.toLocaleString()} {flight.price.currency}
            </div>
            <div className="text-xs text-muted-foreground">per person</div>
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          <div className="relative flex items-start">
            {/* Connected dots on the left side */}
            <div className="absolute left-[0.4rem] top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>
            
            {/* Route info */}
            <div className="z-10 flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mb-1"></div>
                {flight.departureTime && (
                  <div className="text-xs font-semibold">{flight.departureTime}</div>
                )}
              </div>
              
              <div>
                <div className="font-semibold">{flight.departure}</div>
                {flight.departureDate && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {flight.departureDate}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-1">
            <div className="flex justify-between items-center border-l-2 border-dashed border-gray-200 dark:border-gray-700 pl-2">
              <div className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{flight.duration} flight</span>
              </div>
              <div className="text-xs">
                {flight.stops === 0 ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                    Direct
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                    {flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="relative flex items-start">
            <div className="z-10 flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mb-1"></div>
                {flight.arrivalTime && (
                  <div className="text-xs font-semibold">{flight.arrivalTime}</div>
                )}
              </div>
              
              <div>
                <div className="font-semibold">{flight.destination}</div>
                {flight.returnDate && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {flight.returnDate}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {flight.layovers && flight.layovers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-muted-foreground mb-1">Layover details:</div>
            {flight.layovers.map((layover, index) => (
              <div key={index} className="flex items-center text-xs mb-1">
                <div className="font-medium">{layover.airport}</div>
                <ArrowRight className="h-3 w-3 mx-1" />
                <div className="text-muted-foreground">{layover.duration} layover</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}