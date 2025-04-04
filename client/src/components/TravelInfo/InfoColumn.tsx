import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Weather, Itinerary, MapMarker } from '@/lib/types';
import WeatherCard from '@/components/TravelInfo/cards/WeatherCard';
import FlightCard from '@/components/TravelInfo/cards/FlightCard';
import HotelCard from '@/components/TravelInfo/cards/HotelCard';
import RestaurantCard from '@/components/TravelInfo/cards/RestaurantCard';
import ActivityCard from '@/components/TravelInfo/cards/ActivityCard';
import ItineraryCard from '../Itinerary/ItineraryCard';
import InfoCards from '../Map/InfoCards';

interface InfoColumnProps {
  currentLocation: string;
  weather: Weather | null;
  markers: MapMarker[];
  itinerary: Itinerary | null;
}

const InfoColumn: React.FC<InfoColumnProps> = ({
  currentLocation,
  weather,
  markers,
  itinerary
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Filter markers by type
  const restaurantMarkers = markers.filter(marker => marker.type === 'food');
  const attractionMarkers = markers.filter(marker => marker.type === 'attraction' || marker.type === 'landmark');
  const hotelMarkers = markers.filter(marker => marker.type === 'hotel');
  
  return (
    <div className="h-full flex flex-col glass-column">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center">
          <i className="fas fa-info-circle text-primary mr-2"></i>
          Travel Information
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {currentLocation ? `Exploring ${currentLocation}` : 'Start planning your trip'}
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 pt-2 glass-tab-list">
          <TabsTrigger value="overview" className="flex items-center">
            <i className="fas fa-th-large mr-1.5"></i> Overview
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center">
            <i className="fas fa-hotel mr-1.5"></i> Hotels
          </TabsTrigger>
          <TabsTrigger value="flights" className="flex items-center">
            <i className="fas fa-plane mr-1.5"></i> Flights
          </TabsTrigger>
          <TabsTrigger value="food" className="flex items-center">
            <i className="fas fa-utensils mr-1.5"></i> Food
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center">
            <i className="fas fa-hiking mr-1.5"></i> Activities
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1 px-4 py-2">
          <TabsContent value="overview" className="mt-0 space-y-4">
            {weather && (
              <WeatherCard weather={weather} />
            )}
            
            {itinerary && (
              <Card className="glass-darker overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-calendar-alt text-primary mr-2"></i>
                    Itinerary Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ItineraryCard itinerary={itinerary} />
                </CardContent>
              </Card>
            )}
            
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-map-marked-alt text-primary mr-2"></i>
                  Points of Interest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoCards 
                  weather={weather} 
                  foodPlaces={markers.filter(m => m.type === 'food').slice(0, 3)} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hotels" className="mt-0 space-y-4">
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-hotel text-primary mr-2"></i>
                  Top Hotels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hotelMarkers.length > 0 ? (
                  hotelMarkers.map((hotel, index) => (
                    <div key={hotel.id}>
                      <HotelCard
                        name={hotel.name}
                        price="$120"
                        rating={4.5}
                        neighborhood="Downtown"
                      />
                      {index < hotelMarkers.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <i className="fas fa-hotel text-4xl mb-2 opacity-20"></i>
                    <p>No hotels found for this location yet.</p>
                    <p className="text-sm">Ask about accommodations in the chat!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="flights" className="mt-0 space-y-4">
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-plane text-primary mr-2"></i>
                  Available Flights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentLocation ? (
                  <>
                    <FlightCard
                      departure="New York"
                      destination={currentLocation}
                      price="$450"
                      airline="Air France"
                      duration="9h 25m"
                      stops="0"
                    />
                    <Separator />
                    <FlightCard
                      departure="London"
                      destination={currentLocation}
                      price="$320"
                      airline="British Airways"
                      duration="2h 15m"
                      stops="0"
                    />
                    <Separator />
                    <FlightCard
                      departure="Tokyo"
                      destination={currentLocation}
                      price="$890"
                      airline="Japan Airlines"
                      duration="13h 40m"
                      stops="1"
                    />
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <i className="fas fa-plane text-4xl mb-2 opacity-20"></i>
                    <p>No flight information available yet.</p>
                    <p className="text-sm">Ask about flights in the chat!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="food" className="mt-0 space-y-4">
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-utensils text-primary mr-2"></i>
                  Recommended Restaurants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurantMarkers.length > 0 ? (
                  restaurantMarkers.map((restaurant, index) => (
                    <div key={restaurant.id}>
                      <RestaurantCard
                        name={restaurant.name}
                        cuisine="Local Cuisine"
                        price="$$"
                        rating={4.2}
                      />
                      {index < restaurantMarkers.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <i className="fas fa-utensils text-4xl mb-2 opacity-20"></i>
                    <p>No restaurants found for this location yet.</p>
                    <p className="text-sm">Ask about local cuisine in the chat!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activities" className="mt-0 space-y-4">
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-hiking text-primary mr-2"></i>
                  Popular Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attractionMarkers.length > 0 ? (
                  attractionMarkers.map((attraction, index) => (
                    <div key={attraction.id}>
                      <ActivityCard
                        name={attraction.name}
                        type={attraction.type === 'attraction' ? 'Cultural Tour' : 'Landmark Visit'}
                        price={index % 3 === 0 ? 'Free' : '$25'}
                        duration="2 hours"
                      />
                      {index < attractionMarkers.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <i className="fas fa-hiking text-4xl mb-2 opacity-20"></i>
                    <p>No activities found for this location yet.</p>
                    <p className="text-sm">Ask about things to do in the chat!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default InfoColumn;