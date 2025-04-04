import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Weather, Itinerary, MapMarker, LocalFood, LocalAttraction } from '@/lib/types';
import { WeatherCard } from '@/components/TravelInfo/cards/WeatherCard';
import { FlightCard } from '@/components/TravelInfo/cards/FlightCard';
import { HotelCard } from '@/components/TravelInfo/cards/HotelCard';
import { RestaurantCard } from '@/components/TravelInfo/cards/RestaurantCard';
import { ActivityCard } from '@/components/TravelInfo/cards/ActivityCard';
import ItineraryCard from '../Itinerary/ItineraryCard';
import InfoCards from '../Map/InfoCards';
import { searchFlights, searchHotels, getWeatherForLocation } from '@/lib/api';

interface InfoColumnProps {
  currentLocation: string;
  weather: Weather | null;
  markers: MapMarker[];
  itinerary: Itinerary | null;
  localFood?: LocalFood[];
  localAttractions?: LocalAttraction[];
}

const InfoColumn: React.FC<InfoColumnProps> = ({
  currentLocation,
  weather,
  markers,
  itinerary,
  localFood = [],
  localAttractions = []
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [flights, setFlights] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [flightsError, setFlightsError] = useState<string | null>(null);
  const [hotelsError, setHotelsError] = useState<string | null>(null);
  
  // Filter markers by type
  const restaurantMarkers = markers.filter(marker => marker.type === 'food');
  const attractionMarkers = markers.filter(marker => marker.type === 'attraction' || marker.type === 'landmark');
  const hotelMarkers = markers.filter(marker => marker.type === 'hotel');
  
  // Load flight data when the active tab changes to flights
  useEffect(() => {
    async function loadFlightData() {
      if (activeTab === 'flights' && currentLocation && flights.length === 0 && !flightsLoading) {
        setFlightsLoading(true);
        setFlightsError(null);
        
        try {
          // For demonstration purposes, we're using hardcoded origins and dates
          const origins = ['New York', 'London', 'Tokyo'];
          const today = new Date();
          const departDate = new Date(today);
          departDate.setDate(today.getDate() + 7); // 1 week from now
          const returnDate = new Date(departDate);
          returnDate.setDate(departDate.getDate() + 7); // 1 week after departure
          
          // Format dates as YYYY-MM-DD
          const departFormatted = departDate.toISOString().split('T')[0];
          const returnFormatted = returnDate.toISOString().split('T')[0];
          
          // Fetch flights from multiple origins
          const flightPromises = origins.map(origin => 
            searchFlights(origin, currentLocation, departFormatted, returnFormatted)
          );
          
          // Wait for all flight searches to complete
          const results = await Promise.all(flightPromises);
          
          // Flatten results and take first 3 flights
          const allFlights = results.flat().slice(0, 3);
          
          if (allFlights.length > 0) {
            setFlights(allFlights);
          } else {
            setFlightsError('No flights found for this destination.');
          }
        } catch (error) {
          console.error('Error loading flight data:', error);
          setFlightsError('Unable to load flight information.');
        } finally {
          setFlightsLoading(false);
        }
      }
    }
    
    loadFlightData();
  }, [activeTab, currentLocation, flights.length, flightsLoading]);
  
  // Load hotel data when the active tab changes to hotels
  useEffect(() => {
    async function loadHotelData() {
      if (activeTab === 'hotels' && currentLocation && hotels.length === 0 && !hotelsLoading) {
        setHotelsLoading(true);
        setHotelsError(null);
        
        try {
          // Set check-in/out dates for a typical stay
          const today = new Date();
          const checkInDate = new Date(today);
          checkInDate.setDate(today.getDate() + 7); // 1 week from now
          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkInDate.getDate() + 3); // 3-night stay
          
          // Format dates as YYYY-MM-DD
          const checkInFormatted = checkInDate.toISOString().split('T')[0];
          const checkOutFormatted = checkOutDate.toISOString().split('T')[0];
          
          // Fetch hotel data
          const hotelResults = await searchHotels(currentLocation, checkInFormatted, checkOutFormatted);
          
          if (hotelResults.length > 0) {
            setHotels(hotelResults);
          } else {
            setHotelsError('No hotels found for this destination.');
          }
        } catch (error) {
          console.error('Error loading hotel data:', error);
          setHotelsError('Unable to load hotel information.');
        } finally {
          setHotelsLoading(false);
        }
      }
    }
    
    loadHotelData();
  }, [activeTab, currentLocation, hotels.length, hotelsLoading]);
  
  // Function to refresh flight data
  const refreshFlights = () => {
    setFlights([]);
    setFlightsLoading(false);
  };
  
  // Function to refresh hotel data
  const refreshHotels = () => {
    setHotels([]);
    setHotelsLoading(false);
  };
  
  return (
    <div className="h-full flex flex-col glass-column overflow-hidden">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-bold flex items-center">
          <i className="fas fa-info-circle text-primary mr-2"></i>
          Travel Information
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {currentLocation ? `Exploring ${currentLocation}` : 'Start planning your trip'}
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start px-4 pt-2 glass-tab-list flex-shrink-0 overflow-x-auto">
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
        
        <ScrollArea className="flex-1 px-4 py-2 min-h-0 overflow-y-auto">
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
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-hotel text-primary mr-2"></i>
                  Top Hotels
                </CardTitle>
                {hotels.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshHotels}
                    disabled={hotelsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${hotelsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {hotelsLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-pulse mb-2">
                      <i className="fas fa-spinner fa-spin text-2xl"></i>
                    </div>
                    <p>Finding the best hotels in {currentLocation}...</p>
                  </div>
                ) : hotels.length > 0 ? (
                  hotels.map((hotel, index) => (
                    <div key={hotel.id}>
                      <HotelCard hotel={hotel} />
                      {index < hotels.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : hotelMarkers.length > 0 ? (
                  hotelMarkers.map((hotel, index) => (
                    <div key={hotel.id}>
                      <HotelCard
                        hotel={{
                          id: hotel.id,
                          name: hotel.name,
                          address: currentLocation,
                          price: { amount: 120 + (index * 30), currency: "USD" },
                          rating: 4.0 + (index * 0.2),
                          amenities: ["Wifi", "Breakfast", "Pool"]
                        }}
                      />
                      {index < hotelMarkers.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : (
                  <>
                    {hotelsError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {hotelsError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="text-center py-6 text-muted-foreground">
                      <i className="fas fa-hotel text-4xl mb-2 opacity-20"></i>
                      <p>No hotels found for this location yet.</p>
                      <p className="text-sm">Ask about accommodations in the chat!</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="flights" className="mt-0 space-y-4">
            <Card className="glass-darker overflow-hidden">
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-plane text-primary mr-2"></i>
                  Available Flights
                </CardTitle>
                {flights.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshFlights}
                    disabled={flightsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${flightsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {flightsLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-pulse mb-2">
                      <i className="fas fa-spinner fa-spin text-2xl"></i>
                    </div>
                    <p>Searching for flights to {currentLocation}...</p>
                  </div>
                ) : flights.length > 0 ? (
                  flights.map((flight, index) => (
                    <div key={flight.id}>
                      <FlightCard flight={flight} />
                      {index < flights.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : currentLocation ? (
                  <>
                    {flightsError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {flightsError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="text-center py-6 text-muted-foreground">
                      <i className="fas fa-plane text-4xl mb-2 opacity-20"></i>
                      <p>No flight information available yet.</p>
                      <p className="text-sm">Ask about flights in the chat!</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <i className="fas fa-plane text-4xl mb-2 opacity-20"></i>
                    <p>Choose a destination first</p>
                    <p className="text-sm">Tell us where you want to go in the chat!</p>
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
                  Local Cuisine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {localFood.length > 0 ? (
                  localFood.map((food, index) => (
                    <div key={food.id}>
                      <RestaurantCard
                        restaurant={{
                          id: food.id,
                          name: food.name,
                          cuisine: food.description.split('.')[0],
                          address: food.location,
                          price: food.price,
                          rating: 4.5,
                          openingHours: "11:00 AM - 10:00 PM",
                          imageUrl: food.imageUrl
                        }}
                      />
                      {index < localFood.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : restaurantMarkers.length > 0 ? (
                  restaurantMarkers.map((restaurant, index) => (
                    <div key={restaurant.id}>
                      <RestaurantCard
                        restaurant={{
                          id: restaurant.id,
                          name: restaurant.name,
                          cuisine: "Local Cuisine",
                          address: currentLocation,
                          price: ["$", "$$", "$$$"][index % 3],
                          rating: 4.0 + (index * 0.2 % 0.9),
                          openingHours: "11:00 AM - 10:00 PM"
                        }}
                      />
                      {index < restaurantMarkers.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <i className="fas fa-utensils text-4xl mb-2 opacity-20"></i>
                    <p>No local food data available for this location yet.</p>
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
                  Authentic Local Experiences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {localAttractions.length > 0 ? (
                  localAttractions.map((attraction, index) => (
                    <div key={attraction.id}>
                      <ActivityCard
                        activity={{
                          id: attraction.id,
                          name: attraction.name,
                          type: 'Local Experience',
                          price: attraction.price,
                          duration: attraction.duration,
                          location: attraction.location,
                          rating: 4.8,
                          description: attraction.description,
                          imageUrl: attraction.imageUrl
                        }}
                      />
                      {index < localAttractions.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : attractionMarkers.length > 0 ? (
                  attractionMarkers.map((attraction, index) => (
                    <div key={attraction.id}>
                      <ActivityCard
                        activity={{
                          id: attraction.id,
                          name: attraction.name,
                          type: attraction.type === 'attraction' ? 'Cultural Tour' : 'Landmark Visit',
                          price: index % 3 === 0 ? 'Free' : '$25',
                          duration: "2 hours",
                          location: currentLocation,
                          rating: 4.5,
                          availableDates: ["2025-04-15", "2025-04-16", "2025-04-17"]
                        }}
                      />
                      {index < attractionMarkers.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <i className="fas fa-hiking text-4xl mb-2 opacity-20"></i>
                    <p>No local activities found for this location yet.</p>
                    <p className="text-sm">Ask about authentic experiences in the chat!</p>
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