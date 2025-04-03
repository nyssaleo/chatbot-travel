import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processMessage } from "./groq";
import { searchLocation } from "./nominatim";

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

  const httpServer = createServer(app);
  return httpServer;
}
