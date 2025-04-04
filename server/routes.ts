import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processMessage } from "./groq";
import { searchLocation } from "./nominatim";
import { amadeus } from "./amadeus";
import { weatherService } from "./weather";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid message format' });
      }
      
      // Process message with Groq
      const response = await processMessage(message);
      
      // Return the response
      res.json(response);
    } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  });
  
  // Location search endpoint
  app.get('/api/location', async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Invalid location query' });
      }
      
      // Search location with Nominatim
      const locations = await searchLocation(q);
      
      // Return the results
      res.json(locations);
    } catch (error) {
      console.error('Error searching location:', error);
      res.status(500).json({ error: 'Failed to search location' });
    }
  });
  
  // Flights search endpoint
  app.get('/api/flights', async (req, res) => {
    try {
      const { origin, destination, departDate, returnDate, adults, maxPrice } = req.query;
      
      if (!origin || !destination || !departDate || !returnDate) {
        return res.status(400).json({ error: 'Missing required flight search parameters' });
      }
      
      // Get IATA codes for locations
      const originCode = await amadeus.getLocationCode(origin as string);
      const destCode = await amadeus.getLocationCode(destination as string);
      
      if (!originCode || !destCode) {
        return res.status(400).json({ error: 'Unable to find location codes for origin or destination' });
      }
      
      // Search flights
      const flights = await amadeus.searchFlights(
        originCode,
        destCode,
        departDate as string,
        returnDate as string,
        adults ? parseInt(adults as string) : 1,
        maxPrice ? parseInt(maxPrice as string) : undefined
      );
      
      // Return flights
      res.json(flights);
    } catch (error) {
      console.error('Error searching flights:', error);
      res.status(500).json({ error: 'Failed to search flights' });
    }
  });
  
  // Hotels search endpoint
  app.get('/api/hotels', async (req, res) => {
    try {
      const { location, checkIn, checkOut, adults, rooms } = req.query;
      
      if (!location || !checkIn || !checkOut) {
        return res.status(400).json({ error: 'Missing required hotel search parameters' });
      }
      
      // Get IATA code for location
      const cityCode = await amadeus.getLocationCode(location as string);
      
      if (!cityCode) {
        return res.status(400).json({ error: 'Unable to find location code for city' });
      }
      
      // Search hotels
      const hotels = await amadeus.searchHotels(
        cityCode,
        checkIn as string,
        checkOut as string,
        adults ? parseInt(adults as string) : 1,
        rooms ? parseInt(rooms as string) : 1
      );
      
      // Return hotels
      res.json(hotels);
    } catch (error) {
      console.error('Error searching hotels:', error);
      res.status(500).json({ error: 'Failed to search hotels' });
    }
  });
  
  // Weather endpoint
  app.get('/api/weather', async (req, res) => {
    try {
      const { location, days } = req.query;
      
      if (!location) {
        return res.status(400).json({ error: 'Missing required location parameter' });
      }
      
      // Get weather data
      const weatherData = await weatherService.getForecast(
        location as string,
        days ? parseInt(days as string) : 3
      );
      
      // Format weather data
      const formattedWeather = weatherService.formatWeatherData(weatherData, location as string);
      
      // Return weather data
      res.json(formattedWeather);
    } catch (error) {
      console.error('Error getting weather:', error);
      res.status(500).json({ error: 'Failed to get weather data' });
    }
  });
  
  // Itinerary save endpoint
  app.post('/api/itinerary', async (req, res) => {
    try {
      const itinerary = req.body;
      
      if (!itinerary || typeof itinerary !== 'object') {
        return res.status(400).json({ error: 'Invalid itinerary format' });
      }
      
      // Create a fake user ID for now since we don't have auth
      const userId = 1;
      
      // Save itinerary to storage
      const savedItinerary = await storage.createItinerary({
        userId,
        title: itinerary.title,
        destination: itinerary.destination,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        content: itinerary,
      });
      
      // Return the saved itinerary
      res.json(savedItinerary);
    } catch (error) {
      console.error('Error saving itinerary:', error);
      res.status(500).json({ error: 'Failed to save itinerary' });
    }
  });
  
  // Chat history endpoint
  app.get('/api/chat/history', async (req, res) => {
    try {
      // Create a fake user ID for now since we don't have auth
      const userId = 1;
      
      // Get chat history from storage
      const messages = await storage.getMessagesByUserId(userId);
      
      // Return the chat history
      res.json(messages);
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({ error: 'Failed to get chat history' });
    }
  });

  // Clear chat history endpoint (for "New Chat" functionality)
  app.delete('/api/chat/history', async (req, res) => {
    try {
      // In a real app, we would delete messages from the database
      // For now, we'll just return success since we're using in-memory storage
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing chat history:', error);
      res.status(500).json({ error: 'Failed to clear chat history' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
