import { v4 as uuidv4 } from 'uuid';
import { searchLocation } from './nominatim';
import { storage } from './storage';
import { Message, InsertMessage } from '@shared/schema';
import { amadeus } from './amadeus';
import { weatherService } from './weather';

// Message history cache
const conversationHistory = new Map<number, any[]>();

// Travel planning session data
interface TravelSession {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  budget?: number;
  currency?: string;
  travelers?: number;
  flightOptions?: any[];
  hotelOptions?: any[];
  weatherInfo?: any;
}

const travelSessions = new Map<number, TravelSession>();

/**
 * Process a message using Groq API
 */
export async function processMessage(message: string): Promise<any> {
  try {
    // Use a temporary user ID since we don't have authentication
    const userId = 1;
    
    // Get conversation history
    let history = conversationHistory.get(userId) || [];
    
    // Get or create travel session
    let travelSession = travelSessions.get(userId) || {};
    
    // Add user message to history
    history.push({
      role: 'user',
      content: message,
    });
    
    // Store message in the database
    const userMessage: InsertMessage = {
      userId,
      role: 'user',
      content: message,
    };
    await storage.createMessage(userMessage);
    
    // Process the message with Groq
    const groqResponse = await callGroqAPI(history);
    
    // Process travel planning intent
    const isPlanning = message.toLowerCase().includes('trip') || 
                      message.toLowerCase().includes('travel') ||
                      message.toLowerCase().includes('visit') ||
                      message.toLowerCase().includes('flight') ||
                      message.toLowerCase().includes('hotel');
    
    if (isPlanning) {
      travelSession = {
        ...travelSession,
        ...extractTravelDetails(message, travelSession),
      };
      
      // Save updated session
      travelSessions.set(userId, travelSession);
    }
    
    // Extract relevant information
    const { responseText, locations, itinerary, weather } = await extractInformation(groqResponse, message, travelSession);
    
    // Add assistant response to history
    history.push({
      role: 'assistant',
      content: responseText,
    });
    
    // Limit history length
    if (history.length > 10) {
      history = history.slice(history.length - 10);
    }
    
    // Update conversation history
    conversationHistory.set(userId, history);
    
    // Store assistant message in the database
    const assistantMessage: InsertMessage = {
      userId,
      role: 'assistant',
      content: responseText,
    };
    const savedMessage = await storage.createMessage(assistantMessage);
    
    // Return the response
    return {
      id: uuidv4(),
      message: {
        id: savedMessage.id.toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      },
      locations,
      itinerary,
      weather,
      travelSession,
    };
  } catch (error) {
    console.error('Error processing message with Groq:', error);
    throw error;
  }
}

/**
 * Call the Groq API with the conversation history
 */
async function callGroqAPI(history: any[]): Promise<string> {
  try {
    // Check if Groq API key is available
    const apiKey = process.env.GROQ_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('GROQ API key is not available');
    }
    
    // Prepare the prompt
    const systemPrompt = `You are an AI travel assistant that helps users plan trips and provide travel information. 
    
    YOUR CAPABILITIES:
    - Flight booking assistance
    - Hotel recommendations
    - Weather forecasts
    - Itinerary planning
    - Local activity suggestions
    - Budget planning
    
    INSTRUCTIONS:
    - When the user wants to plan a trip, ask for missing details: origin, destination, dates, budget.
    - If the user mentions a budget, convert it to USD if needed for consistency.
    - For flight searches, determine the IATA codes for airports when possible.
    - Create detailed day-by-day itineraries when requested.
    - Respond conversationally and helpfully.
    - Always maintain context from the conversation history.
    
    EXAMPLE PATTERN:
    User: "I want to travel from Hyderabad to Vietnam for 4 days with a budget of ₹100,000."
    Assistant: "I'd be happy to help you plan your 4-day trip from Hyderabad to Vietnam with a budget of ₹100,000 (approximately $1,200 USD). When would you like to travel? I'll need your departure and return dates to search for flights."`;
    
    // Call the Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return generateMockResponse(history[history.length - 1].content);
  }
}

/**
 * Extract travel details from user message
 */
function extractTravelDetails(message: string, currentSession: TravelSession = {}): Partial<TravelSession> {
  const updates: Partial<TravelSession> = {};
  
  // Extract origin
  const originMatch = message.match(/(?:from|in)\s+([A-Za-z\s]+)(?:\s+to|\s+and)/i);
  if (originMatch && !currentSession.origin) {
    updates.origin = originMatch[1].trim();
  }
  
  // Extract destination
  const destMatch = message.match(/(?:to|visit|plan)\s+([A-Za-z\s]+)(?:\s+for|\s+from|\s+with|\s+on|\s+in|\.|$)/i);
  if (destMatch && !currentSession.destination) {
    updates.destination = destMatch[1].trim();
  }
  
  // Extract days
  const daysMatch = message.match(/(\d+)\s*(?:day|days)/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    // Only set dates if we have a number of days but no specific dates yet
    if (!currentSession.departureDate) {
      const today = new Date();
      const departureDate = new Date(today);
      departureDate.setDate(today.getDate() + 30); // Default to 30 days from now
      
      const returnDate = new Date(departureDate);
      returnDate.setDate(departureDate.getDate() + days);
      
      updates.departureDate = departureDate.toISOString().split('T')[0];
      updates.returnDate = returnDate.toISOString().split('T')[0];
    }
  }
  
  // Extract budget
  const budgetMatchINR = message.match(/(?:budget|cost|spend)\s+(?:of\s+)?(?:₹|Rs\.?|INR)\s*([0-9,.]+)/i);
  const budgetMatchUSD = message.match(/(?:budget|cost|spend)\s+(?:of\s+)?\$\s*([0-9,.]+)/i);
  
  if (budgetMatchINR) {
    const budgetINR = parseFloat(budgetMatchINR[1].replace(/,/g, ''));
    // Convert INR to USD (approximate conversion)
    updates.budget = Math.round(budgetINR / 83); // Using approximate exchange rate
    updates.currency = 'USD';
  } else if (budgetMatchUSD) {
    updates.budget = parseFloat(budgetMatchUSD[1].replace(/,/g, ''));
    updates.currency = 'USD';
  }
  
  // Extract number of travelers
  const travelersMatch = message.match(/(\d+)\s*(?:person|people|traveler|travelers|passenger|passengers)/i);
  if (travelersMatch) {
    updates.travelers = parseInt(travelersMatch[1]);
  } else if (!currentSession.travelers) {
    updates.travelers = 1; // Default to 1 traveler
  }
  
  return updates;
}

/**
 * Extract relevant information from the Groq response
 */
async function extractInformation(response: string, userMessage: string, travelSession: TravelSession = {}): Promise<any> {
  // Initialize result
  const result: any = {
    responseText: response,
    locations: [],
    itinerary: null,
    weather: null,
  };
  
  // Extract location information
  const locationMatches = response.match(/([A-Za-z\s]+)(?:\s+is\s+located\s+at|,\s+a\s+city\s+in|,\s+the\s+capital\s+of)/g);
  
  if (locationMatches) {
    // Process location matches asynchronously
    await processLocations(locationMatches, result);
  } else {
    // Try to extract locations from the user message
    const userLocationMatches = userMessage.match(/([A-Za-z\s]+)(?:\s+in\s+|visit\s+|plan\s+a\s+trip\s+to\s+|travel\s+to\s+)/g);
    
    if (userLocationMatches) {
      await processLocations(userLocationMatches, result);
    }
  }
  
  // Extract itinerary information
  if (response.toLowerCase().includes('itinerary') || response.toLowerCase().includes('day 1')) {
    result.itinerary = extractItinerary(response, userMessage);
  }
  
  // Extract weather information
  let weatherLocation = '';
  
  // First try to get location from travel session
  if (travelSession.destination) {
    weatherLocation = travelSession.destination;
  } 
  // Then try to extract from response
  else if (response.toLowerCase().includes('weather') || response.toLowerCase().includes('temperature')) {
    const weatherLocationMatch = response.match(/weather\s+in\s+([A-Za-z\s]+)/i) || 
                            response.match(/(?:in|at)\s+([A-Za-z\s]+)\s+(?:is|ranges|averages)/i) ||
                            response.match(/([A-Za-z\s]+)(?:'s|\s+has|\s+typically\s+has)\s+(?:weather|climate|temperatures)/i);
    
    if (weatherLocationMatch) {
      weatherLocation = weatherLocationMatch[1].trim();
    }
  }
  
  // If we have a location, try to get real weather data
  if (weatherLocation) {
    try {
      const weatherData = await weatherService.getForecast(weatherLocation, 3);
      result.weather = weatherService.formatWeatherData(weatherData, weatherLocation);
    } catch (error) {
      console.error(`Error fetching weather for ${weatherLocation}:`, error);
      // Fallback to extracted weather from the response
      if (response.toLowerCase().includes('weather') || 
          response.toLowerCase().includes('temperature') || 
          response.toLowerCase().includes('climate')) {
        result.weather = extractWeather(response);
      }
    }
  }
  
  // Process flight and hotel information if we have travel session details
  if (travelSession.origin && travelSession.destination && 
      travelSession.departureDate && travelSession.returnDate) {
    try {
      // Get flight options
      const originCode = await amadeus.getLocationCode(travelSession.origin);
      const destCode = await amadeus.getLocationCode(travelSession.destination);
      
      if (originCode && destCode) {
        const flightResults = await amadeus.searchFlights(
          originCode,
          destCode,
          travelSession.departureDate,
          travelSession.returnDate,
          travelSession.travelers || 1,
          travelSession.budget
        );
        
        if (flightResults && flightResults.data && flightResults.data.length > 0) {
          travelSession.flightOptions = flightResults.data;
        }
      }
      
      // Get hotel options
      if (destCode) {
        const hotelResults = await amadeus.searchHotels(
          destCode,
          travelSession.departureDate,
          travelSession.returnDate,
          travelSession.travelers || 1
        );
        
        if (hotelResults && hotelResults.data && hotelResults.data.length > 0) {
          travelSession.hotelOptions = hotelResults.data;
        }
      }
    } catch (error) {
      console.error('Error fetching flight or hotel options:', error);
    }
  }
  
  return result;
}

/**
 * Process location matches and add them to the result
 */
async function processLocations(matches: RegExpMatchArray, result: any): Promise<void> {
  try {
    // Clean up location names
    const locationNames = matches.map(match => {
      return match.replace(/(\s+is\s+located\s+at|,\s+a\s+city\s+in|,\s+the\s+capital\s+of)/g, '').trim();
    });
    
    // Deduplicate locations
    const uniqueLocations = locationNames.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    
    // Limit to the first few locations
    const limitedLocations = uniqueLocations.slice(0, 3);
    
    // Search for locations
    for (const locationName of limitedLocations) {
      try {
        const locations = await searchLocation(locationName);
        
        if (locations && locations.length > 0) {
          result.locations.push(...locations);
        }
      } catch (error) {
        console.error(`Error searching for location "${locationName}":`, error);
      }
    }
  } catch (error) {
    console.error('Error processing locations:', error);
  }
}

/**
 * Extract itinerary information from the response
 */
function extractItinerary(response: string, userMessage: string): any {
  // Try to determine destination from user message
  const destinationMatches = userMessage.match(/(?:trip|visit|travel|itinerary|plan)(?:\s+(?:to|for|in|at))\s+([A-Za-z\s]+)/i);
  const destination = destinationMatches ? destinationMatches[1].trim() : 'Your Destination';
  
  // Try to determine days from user message
  const daysMatches = userMessage.match(/(\d+)\s*(?:day|days)/i);
  const numberOfDays = daysMatches ? parseInt(daysMatches[1]) : 3;
  
  // Create enhanced mock itinerary based on destination
  const days = [];
  
  // Generate itinerary based on destination and number of days
  if (destination.toLowerCase().includes('tokyo')) {
    // Tokyo-specific itinerary
    days.push({
      day: 1,
      title: 'Tokyo Highlights',
      activities: [
        { time: '9:00 AM', description: 'Tokyo Metropolitan Government Building for panoramic city views' },
        { time: '11:30 AM', description: 'Meiji Shrine and peaceful forest walk' },
        { time: '1:00 PM', description: 'Lunch at Harajuku\'s trendy cafes' },
        { time: '3:00 PM', description: 'Shibuya Crossing and shopping district exploration' },
        { time: '6:30 PM', description: 'Dinner at an izakaya in Shinjuku' },
        { time: '8:00 PM', description: 'Nighttime views from Tokyo Tower' }
      ]
    });
    
    if (numberOfDays >= 2) {
      days.push({
        day: 2,
        title: 'Traditional Tokyo',
        activities: [
          { time: '8:30 AM', description: 'Early morning visit to Tsukiji Outer Market for sushi breakfast' },
          { time: '10:30 AM', description: 'Asakusa and Senso-ji Temple exploration' },
          { time: '1:00 PM', description: 'Lunch at a traditional tempura restaurant' },
          { time: '2:30 PM', description: 'Tokyo National Museum in Ueno Park' },
          { time: '5:00 PM', description: 'Akihabara Electric Town for anime and electronics' },
          { time: '7:30 PM', description: 'Dinner at a themed restaurant experience' }
        ]
      });
    }
    
    if (numberOfDays >= 3) {
      days.push({
        day: 3,
        title: 'Modern Tokyo',
        activities: [
          { time: '9:00 AM', description: 'Teamlab Borderless Digital Art Museum' },
          { time: '12:00 PM', description: 'Lunch at Toyosu Fish Market' },
          { time: '2:00 PM', description: 'Odaiba entertainment district and Tokyo Bay views' },
          { time: '4:30 PM', description: 'Shopping in Ginza luxury district' },
          { time: '7:00 PM', description: 'Dinner at a Michelin-starred restaurant' },
          { time: '9:00 PM', description: 'Drinks in Roppongi entertainment district' }
        ]
      });
    }
    
    if (numberOfDays >= 4) {
      days.push({
        day: 4,
        title: 'Day Trip to Hakone',
        activities: [
          { time: '7:30 AM', description: 'Bullet train to Hakone' },
          { time: '9:30 AM', description: 'Lake Ashi scenic cruise with Mt. Fuji views' },
          { time: '12:00 PM', description: 'Traditional Japanese lunch in Hakone' },
          { time: '2:00 PM', description: 'Hakone Open-Air Museum' },
          { time: '4:00 PM', description: 'Relax in a traditional onsen hot spring' },
          { time: '7:00 PM', description: 'Return to Tokyo for dinner' }
        ]
      });
    }
  } else if (destination.toLowerCase().includes('paris')) {
    // Paris-specific itinerary
    days.push({
      day: 1,
      title: 'Classic Paris',
      activities: [
        { time: '9:00 AM', description: 'Eiffel Tower visit (book tickets in advance)' },
        { time: '11:30 AM', description: 'Seine River cruise' },
        { time: '1:00 PM', description: 'Lunch at a classic Parisian café' },
        { time: '3:00 PM', description: 'Louvre Museum (focus on key masterpieces)' },
        { time: '6:30 PM', description: 'Stroll through the Tuileries Garden' },
        { time: '8:00 PM', description: 'Dinner in Le Marais district' }
      ]
    });
    
    if (numberOfDays >= 2) {
      days.push({
        day: 2,
        title: 'Historical Paris',
        activities: [
          { time: '8:30 AM', description: 'Notre-Dame Cathedral exterior and Île de la Cité' },
          { time: '10:30 AM', description: 'Sainte-Chapelle stained glass masterpiece' },
          { time: '12:00 PM', description: 'Lunch in the Latin Quarter' },
          { time: '2:00 PM', description: 'Musée d\'Orsay for impressionist art' },
          { time: '5:00 PM', description: 'Luxembourg Gardens relaxation' },
          { time: '7:30 PM', description: 'Dinner at a traditional bistro in Saint-Germain' }
        ]
      });
    }
    
    if (numberOfDays >= 3) {
      days.push({
        day: 3,
        title: 'Artistic Paris',
        activities: [
          { time: '9:00 AM', description: 'Montmartre hill and Sacré-Cœur Basilica' },
          { time: '11:00 AM', description: 'Place du Tertre artist square' },
          { time: '1:00 PM', description: 'Lunch with a view of Paris' },
          { time: '3:00 PM', description: 'Centre Pompidou modern art museum' },
          { time: '5:30 PM', description: 'Shopping along the Champs-Élysées' },
          { time: '8:00 PM', description: 'Dinner and cabaret show' }
        ]
      });
    }
    
    if (numberOfDays >= 4) {
      days.push({
        day: 4,
        title: 'Versailles Day Trip',
        activities: [
          { time: '8:00 AM', description: 'Train to Versailles Palace' },
          { time: '9:30 AM', description: 'Tour of the opulent State Apartments and Hall of Mirrors' },
          { time: '12:30 PM', description: 'Lunch at a restaurant in Versailles town' },
          { time: '2:00 PM', description: 'Explore the magnificent palace gardens' },
          { time: '4:00 PM', description: 'Visit the Grand and Petit Trianon' },
          { time: '7:00 PM', description: 'Return to Paris for dinner' }
        ]
      });
    }
  } else if (destination.toLowerCase().includes('new york') || destination.toLowerCase().includes('nyc')) {
    // New York-specific itinerary
    days.push({
      day: 1,
      title: 'Iconic Manhattan',
      activities: [
        { time: '9:00 AM', description: 'Empire State Building observation deck' },
        { time: '11:30 AM', description: 'Fifth Avenue and Grand Central Terminal' },
        { time: '1:00 PM', description: 'Lunch at a New York deli' },
        { time: '2:30 PM', description: 'Times Square and Broadway area' },
        { time: '5:00 PM', description: 'Stroll through Central Park' },
        { time: '7:30 PM', description: 'Dinner in Midtown Manhattan' }
      ]
    });
    
    if (numberOfDays >= 2) {
      days.push({
        day: 2,
        title: 'Downtown & Financial District',
        activities: [
          { time: '8:30 AM', description: 'Ferry to Statue of Liberty and Ellis Island' },
          { time: '12:00 PM', description: 'Lunch in the Financial District' },
          { time: '1:30 PM', description: '9/11 Memorial and Museum' },
          { time: '4:00 PM', description: 'One World Observatory views' },
          { time: '5:30 PM', description: 'Walk across the Brooklyn Bridge' },
          { time: '7:00 PM', description: 'Dinner in Dumbo with Manhattan skyline views' }
        ]
      });
    }
    
    if (numberOfDays >= 3) {
      days.push({
        day: 3,
        title: 'Museum Mile & Upper East Side',
        activities: [
          { time: '9:00 AM', description: 'Metropolitan Museum of Art' },
          { time: '12:30 PM', description: 'Lunch at a Madison Avenue café' },
          { time: '2:00 PM', description: 'Guggenheim Museum' },
          { time: '4:00 PM', description: 'Shopping on Madison Avenue' },
          { time: '6:00 PM', description: 'Walk through Central Park at sunset' },
          { time: '8:00 PM', description: 'Dinner in the Upper West Side' }
        ]
      });
    }
    
    if (numberOfDays >= 4) {
      days.push({
        day: 4,
        title: 'Brooklyn Exploration',
        activities: [
          { time: '9:00 AM', description: 'Brooklyn Heights Promenade views' },
          { time: '10:30 AM', description: 'Prospect Park and Grand Army Plaza' },
          { time: '12:30 PM', description: 'Lunch at a trendy Williamsburg restaurant' },
          { time: '2:30 PM', description: 'Brooklyn Museum and Botanic Garden' },
          { time: '5:00 PM', description: 'Shopping and art galleries in Williamsburg' },
          { time: '7:30 PM', description: 'Dinner at a Brooklyn farm-to-table restaurant' }
        ]
      });
    }
  } else if (destination.toLowerCase().includes('barcelona')) {
    // Barcelona-specific itinerary
    days.push({
      day: 1,
      title: 'Gaudí Masterpieces',
      activities: [
        { time: '9:00 AM', description: 'Sagrada Família (pre-book tickets)' },
        { time: '12:00 PM', description: 'Lunch near Eixample district' },
        { time: '2:00 PM', description: 'Casa Batlló and Casa Milà (La Pedrera)' },
        { time: '5:00 PM', description: 'Stroll down Passeig de Gràcia' },
        { time: '7:00 PM', description: 'Sunset drink at a rooftop bar' },
        { time: '8:30 PM', description: 'Dinner and tapas in the Gothic Quarter' }
      ]
    });
    
    if (numberOfDays >= 2) {
      days.push({
        day: 2,
        title: 'Historic Barcelona',
        activities: [
          { time: '9:00 AM', description: 'Gothic Quarter walking tour' },
          { time: '11:00 AM', description: 'Barcelona Cathedral and Santa Maria del Mar' },
          { time: '1:00 PM', description: 'Lunch at La Boqueria Market' },
          { time: '3:00 PM', description: 'Picasso Museum' },
          { time: '5:30 PM', description: 'El Born district exploration' },
          { time: '8:00 PM', description: 'Dinner with flamenco show' }
        ]
      });
    }
    
    if (numberOfDays >= 3) {
      days.push({
        day: 3,
        title: 'Montjuïc Hill',
        activities: [
          { time: '9:00 AM', description: 'Park Güell (pre-book tickets)' },
          { time: '12:00 PM', description: 'Lunch in Gràcia neighborhood' },
          { time: '2:00 PM', description: 'Cable car to Montjuïc' },
          { time: '3:00 PM', description: 'National Art Museum of Catalonia' },
          { time: '5:30 PM', description: 'Magic Fountain (check show times)' },
          { time: '8:00 PM', description: 'Seafood dinner at Barceloneta beach' }
        ]
      });
    }
    
    if (numberOfDays >= 4) {
      days.push({
        day: 4,
        title: 'Montserrat Day Trip',
        activities: [
          { time: '8:00 AM', description: 'Train to Montserrat mountain' },
          { time: '10:00 AM', description: 'Visit the Santa Maria de Montserrat monastery' },
          { time: '12:00 PM', description: 'Listen to the famous boys choir (if performing)' },
          { time: '1:30 PM', description: 'Lunch with mountain views' },
          { time: '3:00 PM', description: 'Hiking in the surrounding natural park' },
          { time: '7:00 PM', description: 'Return to Barcelona for dinner' }
        ]
      });
    }
  } else {
    // Generic itinerary for any other destination
    days.push({
      day: 1,
      title: `${destination} Highlights`,
      activities: [
        { time: '9:00 AM', description: 'Visit the main historical landmark' },
        { time: '11:30 AM', description: 'Guided walking tour of the city center' },
        { time: '1:00 PM', description: 'Lunch featuring local cuisine' },
        { time: '3:00 PM', description: 'Explore the premier museum or cultural site' },
        { time: '5:30 PM', description: 'Shopping in the main commercial area' },
        { time: '8:00 PM', description: 'Welcome dinner at a highly-rated restaurant' }
      ]
    });
    
    if (numberOfDays >= 2) {
      days.push({
        day: 2,
        title: 'Cultural Immersion',
        activities: [
          { time: '8:30 AM', description: 'Local market visit' },
          { time: '10:30 AM', description: 'Cultural or historical neighborhood exploration' },
          { time: '1:00 PM', description: 'Lunch at a local favorite restaurant' },
          { time: '2:30 PM', description: 'Visit to secondary attractions and photo spots' },
          { time: '5:00 PM', description: 'Relaxation time at a park or scenic area' },
          { time: '7:30 PM', description: 'Evening entertainment and dinner' }
        ]
      });
    }
    
    if (numberOfDays >= 3) {
      days.push({
        day: 3,
        title: 'Local Experiences',
        activities: [
          { time: '9:00 AM', description: 'Specialty museum or unique attraction' },
          { time: '11:30 AM', description: 'Cooking class or cultural workshop' },
          { time: '1:30 PM', description: 'Lunch featuring dishes you learned to prepare' },
          { time: '3:00 PM', description: 'Off-the-beaten-path neighborhood exploration' },
          { time: '5:30 PM', description: 'Sunset viewpoint visit' },
          { time: '8:00 PM', description: 'Farewell dinner at a special venue' }
        ]
      });
    }
    
    if (numberOfDays >= 4) {
      days.push({
        day: 4,
        title: 'Day Trip Adventure',
        activities: [
          { time: '8:00 AM', description: 'Transportation to nearby natural or historical attraction' },
          { time: '10:00 AM', description: 'Guided tour of the site' },
          { time: '12:30 PM', description: 'Regional lunch experience' },
          { time: '2:00 PM', description: 'Additional sightseeing or activities' },
          { time: '4:30 PM', description: 'Local specialties shopping or tasting' },
          { time: '7:00 PM', description: 'Return to main destination for dinner' }
        ]
      });
    }
  }
  
  return {
    id: uuidv4(),
    title: `${destination} Itinerary (${numberOfDays} Days)`,
    destination,
    days,
  };
}

/**
 * Extract weather information from the response
 */
function extractWeather(response: string): any {
  // Try to determine location from the response
  const locationMatch = response.match(/weather\s+in\s+([A-Za-z\s]+)/i) || 
                        response.match(/(?:in|at)\s+([A-Za-z\s]+)\s+(?:is|ranges|averages)/i) ||
                        response.match(/([A-Za-z\s]+)(?:'s|\s+has|\s+typically\s+has)\s+(?:weather|climate|temperatures)/i);
  
  const location = locationMatch ? locationMatch[1].trim() : 'the destination';
  
  // Create enhanced mock weather based on location
  let tempMin = '';
  let tempMax = '';
  let tempAvg = '';
  let conditions = '';
  let season = '';
  let icon = '🌤️';
  
  // Generate location-specific weather information
  if (location.toLowerCase().includes('tokyo')) {
    // Tokyo weather by season
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    if (currentMonth >= 3 && currentMonth <= 5) { // Spring
      tempMin = '10°C';
      tempMax = '21°C';
      tempAvg = '15°C';
      conditions = 'Mild with occasional rain';
      season = 'Spring';
      icon = '🌸';
    } else if (currentMonth >= 6 && currentMonth <= 8) { // Summer
      tempMin = '23°C';
      tempMax = '31°C';
      tempAvg = '27°C';
      conditions = 'Hot and humid with occasional thunderstorms';
      season = 'Summer';
      icon = '☀️';
    } else if (currentMonth >= 9 && currentMonth <= 11) { // Fall
      tempMin = '15°C';
      tempMax = '26°C';
      tempAvg = '21°C';
      conditions = 'Mild and sunny with cool evenings';
      season = 'Fall';
      icon = '🍂';
    } else { // Winter
      tempMin = '2°C';
      tempMax = '12°C';
      tempAvg = '7°C';
      conditions = 'Cold and mostly sunny with rare snowfall';
      season = 'Winter';
      icon = '❄️';
    }
  } else if (location.toLowerCase().includes('paris')) {
    // Paris weather by season
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    if (currentMonth >= 3 && currentMonth <= 5) { // Spring
      tempMin = '7°C';
      tempMax = '18°C';
      tempAvg = '13°C';
      conditions = 'Mild with occasional light rain';
      season = 'Spring';
      icon = '🌧️';
    } else if (currentMonth >= 6 && currentMonth <= 8) { // Summer
      tempMin = '15°C';
      tempMax = '25°C';
      tempAvg = '20°C';
      conditions = 'Warm and generally sunny with occasional storms';
      season = 'Summer';
      icon = '☀️';
    } else if (currentMonth >= 9 && currentMonth <= 11) { // Fall
      tempMin = '8°C';
      tempMax = '19°C';
      tempAvg = '14°C';
      conditions = 'Mild with increasing rainfall';
      season = 'Fall';
      icon = '🍂';
    } else { // Winter
      tempMin = '3°C';
      tempMax = '8°C';
      tempAvg = '6°C';
      conditions = 'Cold and damp with occasional freezing periods';
      season = 'Winter';
      icon = '☁️';
    }
  } else if (location.toLowerCase().includes('new york') || location.toLowerCase().includes('nyc')) {
    // New York weather by season
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    if (currentMonth >= 3 && currentMonth <= 5) { // Spring
      tempMin = '5°C';
      tempMax = '19°C';
      tempAvg = '12°C';
      conditions = 'Variable with warming trend and spring showers';
      season = 'Spring';
      icon = '🌦️';
    } else if (currentMonth >= 6 && currentMonth <= 8) { // Summer
      tempMin = '20°C';
      tempMax = '30°C';
      tempAvg = '25°C';
      conditions = 'Hot and humid with occasional thunderstorms';
      season = 'Summer';
      icon = '☀️';
    } else if (currentMonth >= 9 && currentMonth <= 11) { // Fall
      tempMin = '10°C';
      tempMax = '22°C';
      tempAvg = '16°C';
      conditions = 'Mild with vibrant foliage and crisp air';
      season = 'Fall';
      icon = '🍂';
    } else { // Winter
      tempMin = '-2°C';
      tempMax = '5°C';
      tempAvg = '2°C';
      conditions = 'Cold with snow and occasional freezing rain';
      season = 'Winter';
      icon = '❄️';
    }
  } else if (location.toLowerCase().includes('barcelona')) {
    // Barcelona weather by season
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    if (currentMonth >= 3 && currentMonth <= 5) { // Spring
      tempMin = '10°C';
      tempMax = '21°C';
      tempAvg = '16°C';
      conditions = 'Mild and pleasant with occasional light rain';
      season = 'Spring';
      icon = '🌤️';
    } else if (currentMonth >= 6 && currentMonth <= 8) { // Summer
      tempMin = '20°C';
      tempMax = '29°C';
      tempAvg = '25°C';
      conditions = 'Hot and sunny with low humidity';
      season = 'Summer';
      icon = '☀️';
    } else if (currentMonth >= 9 && currentMonth <= 11) { // Fall
      tempMin = '14°C';
      tempMax = '24°C';
      tempAvg = '19°C';
      conditions = 'Warm days and cool evenings with some rainfall';
      season = 'Fall';
      icon = '🌥️';
    } else { // Winter
      tempMin = '8°C';
      tempMax = '15°C';
      tempAvg = '12°C';
      conditions = 'Mild with occasional rain and rare cold spells';
      season = 'Winter';
      icon = '🌧️';
    }
  } else {
    // Generic weather (moderately pleasant)
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    if (currentMonth >= 3 && currentMonth <= 5) { // Spring
      tempMin = '12°C';
      tempMax = '22°C';
      tempAvg = '17°C';
      conditions = 'Mild and increasingly warm';
      season = 'Spring';
      icon = '🌼';
    } else if (currentMonth >= 6 && currentMonth <= 8) { // Summer
      tempMin = '18°C';
      tempMax = '28°C';
      tempAvg = '23°C';
      conditions = 'Warm and sunny';
      season = 'Summer';
      icon = '☀️';
    } else if (currentMonth >= 9 && currentMonth <= 11) { // Fall
      tempMin = '10°C';
      tempMax = '20°C';
      tempAvg = '15°C';
      conditions = 'Mild with cooling trend';
      season = 'Fall';
      icon = '🍂';
    } else { // Winter
      tempMin = '5°C';
      tempMax = '12°C';
      tempAvg = '8°C';
      conditions = 'Cool with occasional precipitation';
      season = 'Winter';
      icon = '❄️';
    }
  }
  
  return {
    location,
    temperature: {
      average: tempAvg,
      min: tempMin,
      max: tempMax,
    },
    conditions,
    season,
    icon,
  };
}

/**
 * Generate a mock response for development purposes
 */
function generateMockResponse(userMessage: string): string {
  // Check for common travel keywords
  const lowerMessage = userMessage.toLowerCase();
  
  // Tokyo-specific information
  if (lowerMessage.includes('tokyo')) {
    return "Tokyo is a fascinating destination with a unique blend of ultramodern and traditional. The city offers incredible food, beautiful gardens, and cutting-edge technology everywhere you look.\n\n" +
      "🌸 Best time to visit: Late March to early April for cherry blossoms, or October to November for autumn colors.\n\n" +
      "🏙️ Top attractions:\n" +
      "• Shinjuku Gyoen National Garden - One of Tokyo's most beautiful parks\n" +
      "• Meiji Shrine - A peaceful forest shrine in the heart of the city\n" +
      "• Tokyo Skytree - For panoramic views of the entire metropolis\n" +
      "• Senso-ji Temple - Tokyo's oldest Buddhist temple in Asakusa\n\n" +
      "🍣 Food recommendations:\n" +
      "• Tsukiji Outer Market - For the freshest sushi breakfast\n" +
      "• Shinjuku Omoide Yokocho - Atmospheric alley of tiny eateries\n" +
      "• Harajuku Takeshita Street - For creative desserts and street food\n\n" +
      "Would you like a detailed 3-day itinerary for Tokyo or information about specific aspects of your trip?";
  }
  
  // Paris-specific information
  if (lowerMessage.includes('paris')) {
    return "Paris, the 'City of Light,' is renowned for its art, architecture, cuisine, and cultural heritage. It's a city that rewards slow exploration and appreciation of its many charms.\n\n" +
      "🗼 Must-visit attractions:\n" +
      "• Eiffel Tower - Especially beautiful at night when illuminated\n" +
      "• Louvre Museum - Home to thousands of works including the Mona Lisa\n" +
      "• Notre-Dame Cathedral - Currently under restoration after the 2019 fire\n" +
      "• Montmartre - Bohemian hillside area with stunning city views\n\n" +
      "🥐 Culinary experiences:\n" +
      "• Le Marais district - For classic Parisian cafés and bistros\n" +
      "• Rue Cler - Charming market street with specialty food shops\n" +
      "• Luxembourg Gardens area - Perfect for a picnic with local delicacies\n\n" +
      "🏨 Recommended neighborhoods to stay:\n" +
      "• Le Marais (4th) - Central, historic and vibrant\n" +
      "• Saint-Germain-des-Prés (6th) - Classic literary Paris\n" +
      "• Montmartre (18th) - Artistic atmosphere with village-like charm\n\n" +
      "Would you like me to create a personalized itinerary for Paris or provide more specific recommendations?";
  }
  
  // New York-specific information
  if (lowerMessage.includes('new york') || lowerMessage.includes('nyc')) {
    return "New York City is an iconic global metropolis offering incredible diversity in culture, food, arts, and experiences. The city's energy is unmatched and there's something for every type of traveler.\n\n" +
      "🗽 Classic attractions:\n" +
      "• Central Park - An 843-acre urban oasis with countless activities\n" +
      "• Times Square - The bright lights and energy of the city\n" +
      "• Empire State Building - Offering spectacular views from its observation deck\n" +
      "• Metropolitan Museum of Art - One of the world's finest art collections\n\n" +
      "🍕 Food scenes by borough:\n" +
      "• Manhattan - From Michelin-starred restaurants to iconic delis\n" +
      "• Brooklyn - Trendy food scene in Williamsburg and DUMBO\n" +
      "• Queens - Authentic international cuisines in neighborhoods like Flushing and Astoria\n\n" +
      "🏙️ Neighborhood experiences:\n" +
      "• Greenwich Village - Historic brownstones and literary heritage\n" +
      "• DUMBO - Brooklyn waterfront with stunning Manhattan views\n" +
      "• Harlem - Rich cultural history and incredible soul food\n\n" +
      "Would you like recommendations for a specific interest in NYC, or would you prefer a curated itinerary?";
  }
  
  // Barcelona-specific information
  if (lowerMessage.includes('barcelona')) {
    return "Barcelona captivates visitors with its unique architecture, Mediterranean beaches, and vibrant cultural scene. The Catalan capital offers a perfect blend of history, art, cuisine, and seaside relaxation.\n\n" +
      "🏛️ Gaudí masterpieces:\n" +
      "• Sagrada Família - The awe-inspiring unfinished basilica\n" +
      "• Park Güell - Whimsical park with amazing city views\n" +
      "• Casa Batlló - Fascinating marine-inspired architecture\n\n" +
      "🥘 Culinary highlights:\n" +
      "• La Boqueria Market - Colorful food market to sample local produce\n" +
      "• El Born district - Tapas bars and Catalan wine venues\n" +
      "• Barceloneta - Seafood restaurants along the beachfront\n\n" +
      "🚶‍♀️ Areas to explore:\n" +
      "• Gothic Quarter - Medieval narrow streets and plazas\n" +
      "• Eixample - Modernist architecture in a grid-pattern district\n" +
      "• Montjuïc - Hillside park with museums and Olympic venues\n\n" +
      "Would you like more information about activities in Barcelona or help creating an itinerary?";
  }
  
  // Handle hotel request
  if (lowerMessage.includes('hotel') || lowerMessage.includes('stay') || lowerMessage.includes('accommodation')) {
    const cityMatches = lowerMessage.match(/(?:in|at)\s+([a-zA-Z\s]+)(?:$|\?|\.)/);
    const city = cityMatches ? cityMatches[1].trim() : "your destination";
    
    return "When looking for accommodations in " + city + ", consider these options:\n\n" +
      "🏨 Luxury options:\n" +
      "• Grand Palace Hotel - City center location with rooftop pool\n" +
      "• The Royal Suites - Historic building with modern amenities\n" +
      "• Panorama Heights - Offering stunning views and premium service\n\n" +
      "🛏️ Mid-range choices:\n" +
      "• Central Comfort Inn - Great value in a convenient location\n" +
      "• Park View Suites - Quiet area near main attractions\n" +
      "• Riverside Boutique Hotel - Charming smaller hotel with local character\n\n" +
      "💰 Budget-friendly stays:\n" +
      "• Traveler's Hostel - Clean, social atmosphere with private rooms available\n" +
      "• City Lights Guesthouse - Family-run with breakfast included\n" +
      "• Urban Backpackers - Modern facilities and walking distance to transport\n\n" +
      "Would you like more specific accommodation recommendations based on your preferences for " + city + "?";
  }
  
  // Handle restaurant request
  if (lowerMessage.includes('food') || lowerMessage.includes('restaurant') || lowerMessage.includes('eat')) {
    const cityMatches = lowerMessage.match(/(?:in|at)\s+([a-zA-Z\s]+)(?:$|\?|\.)/);
    const city = cityMatches ? cityMatches[1].trim() : "your destination";
    
    return "Food is one of the best ways to experience " + city + "'s culture! Here are some dining recommendations:\n\n" +
      "🌟 Fine dining experiences:\n" +
      "• Seasons Restaurant - Seasonal tasting menu with local ingredients\n" +
      "• Azure - Waterfront views with contemporary cuisine\n" +
      "• La Maison - Classic dishes with an innovative twist\n\n" +
      "🍽️ Local favorites:\n" +
      "• Old Town Bistro - Authentic regional specialties\n" +
      "• Market Kitchen - Fresh ingredients from the local market\n" +
      "• Spice Alley - Popular with locals for its vibrant flavors\n\n" +
      "🛍️ Food markets and streets:\n" +
      "• Central Market - Perfect for sampling a variety of local foods\n" +
      "• Riverside Night Market - Evening food stalls with a lively atmosphere\n" +
      "• Culinary Quarter - Area with concentrated excellent eateries\n\n" +
      "Would you like me to suggest a culinary tour route or specific dishes to try in " + city + "?";
  }
  
  // Handle itinerary request
  if (lowerMessage.includes('itinerary') || lowerMessage.includes('plan') || lowerMessage.includes('schedule')) {
    const cityMatches = lowerMessage.match(/(?:for|in|at)\s+([a-zA-Z\s]+)(?:$|\?|\.)/);
    const city = cityMatches ? cityMatches[1].trim() : "your destination";
    
    const daysMatches = lowerMessage.match(/(\d+)\s*(?:day|days)/);
    const days = daysMatches ? parseInt(daysMatches[1]) : 3;
    
    if (days <= 2) {
      return "I'd be happy to help you create a " + days + "-day itinerary for " + city + "! Here's my suggestion for a short but fulfilling visit:\n\n" +
        "Day 1: Essential " + city + "\n" +
        "• Morning: Start with breakfast at a local café, then visit the main landmark\n" +
        "• Afternoon: Explore the historic district with a stop for lunch\n" +
        "• Evening: Dinner at a renowned local restaurant and night walk through illuminated sites\n\n" +
        "Day 2: Deeper Experiences\n" +
        "• Morning: Visit the top museum or cultural attraction\n" +
        "• Afternoon: Shopping and local experiences in the popular district\n" +
        "• Evening: Farewell dinner at a scenic viewpoint restaurant\n\n" +
        "Would you like me to customize this itinerary based on specific interests (art, food, outdoors, etc.)?";
    }
    
    return "I'd be happy to create a " + days + "-day itinerary for " + city + "! Here's a suggested plan to make the most of your time:\n\n" +
      "Day 1: City Highlights\n" +
      "• Morning: Begin with breakfast at Central Café, then visit the main historical site\n" +
      "• Afternoon: Guided walking tour through the old town with lunch at a local spot\n" +
      "• Evening: Welcome dinner at a traditional restaurant with cultural performance\n\n" +
      "Day 2: Cultural Immersion\n" +
      "• Morning: Visit the premier art museum and nearby gardens\n" +
      "• Afternoon: Cooking class featuring local specialties\n" +
      "• Evening: Dinner at an acclaimed fusion restaurant\n\n" +
      "Day 3: Local Experience\n" +
      "• Morning: Explore the local market and hidden neighborhood gems\n" +
      "• Afternoon: Leisure time for shopping or optional excursion\n" +
      "• Evening: Sunset viewpoint followed by dinner at a waterfront restaurant\n\n" +
      (days > 3 ? "Day 4: Day Trip Adventure\n" +
      "• Full day: Excursion to nearby natural attraction or historical site with packed lunch\n" +
      "• Evening: Return for relaxed dinner at an authentic local bistro\n\n" : "") +
      "Would you like me to tailor this itinerary based on specific interests or preferences?";
  }
  
  // Handle weather request
  if (lowerMessage.includes('weather') || lowerMessage.includes('climate') || lowerMessage.includes('temperature')) {
    const cityMatches = lowerMessage.match(/(?:in|at)\s+([a-zA-Z\s]+)(?:$|\?|\.)/);
    const city = cityMatches ? cityMatches[1].trim() : "your destination";
    
    const monthMatches = lowerMessage.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
    const month = monthMatches ? monthMatches[1].charAt(0).toUpperCase() + monthMatches[1].slice(1).toLowerCase() : "this time of year";
    
    return "Weather in " + city + " during " + month + ":\n\n" +
      "🌡️ Temperature range: Typically 18-25°C (64-77°F)\n" +
      "☁️ Conditions: Mostly sunny with occasional scattered clouds\n" +
      "🌧️ Precipitation: Low chance of rain, around 20%\n" +
      "👕 What to pack: Light layers, a light jacket for evenings, comfortable walking shoes\n\n" +
      "Climate considerations:\n" +
      "• Mornings and evenings can be cooler\n" +
      "• UV index is generally high during midday\n" +
      "• Indoor venues are typically climate-controlled\n\n" +
      "Would you like specific advice on what to pack or activities suited to the weather in " + city + " during " + month + "?";
  }
  
  // Default response
  return "I'm your travel planning assistant and I'm here to help you plan your perfect trip! I can provide detailed information about destinations, create personalized itineraries, and offer recommendations for:\n\n" +
    "🌍 Popular destinations - Paris, Tokyo, New York, Barcelona, and many more\n" +
    "🏨 Accommodation options - From luxury hotels to budget-friendly hostels\n" +
    "🍽️ Dining experiences - Local specialties and restaurant recommendations\n" +
    "🗺️ Customized itineraries - Plans tailored to your interests and timeframe\n" +
    "☀️ Weather guidance - What to expect and pack for your trip\n\n" +
    "Simply tell me where you'd like to go or what you'd like to know, and I'll provide personalized recommendations. For example, you could ask about 'restaurants in Barcelona' or 'a 3-day itinerary for Tokyo'.";
}
