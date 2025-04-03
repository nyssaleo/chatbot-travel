import { v4 as uuidv4 } from 'uuid';
import { searchLocation } from './nominatim';
import { storage } from './storage';
import { Message, InsertMessage } from '@shared/schema';

// Message history cache
const conversationHistory = new Map<number, any[]>();

/**
 * Process a message using Groq API
 */
export async function processMessage(message: string): Promise<any> {
  try {
    // Use a temporary user ID since we don't have authentication
    const userId = 1;
    
    // Get conversation history
    let history = conversationHistory.get(userId) || [];
    
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
    
    // Extract relevant information
    const { responseText, locations, itinerary, weather } = extractInformation(groqResponse, message);
    
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
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '';
    
    if (!apiKey) {
      // For development, return a mock response if no API key is available
      return generateMockResponse(history[history.length - 1].content);
    }
    
    // Prepare the prompt
    const systemPrompt = `You are an AI travel assistant that helps users plan trips and provide travel information. 
    Respond conversationally and helpfully. For locations mentioned, include their coordinates when relevant.
    If the user asks about a specific place, provide interesting facts, recommended activities, and travel tips.
    If the user wants an itinerary, create a structured day-by-day plan.
    Always maintain context from the conversation history.`;
    
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
 * Extract relevant information from the Groq response
 */
function extractInformation(response: string, userMessage: string): any {
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
    processLocations(locationMatches, result);
  } else {
    // Try to extract locations from the user message
    const userLocationMatches = userMessage.match(/([A-Za-z\s]+)(?:\s+in\s+|visit\s+|plan\s+a\s+trip\s+to\s+|travel\s+to\s+)/g);
    
    if (userLocationMatches) {
      processLocations(userLocationMatches, result);
    }
  }
  
  // Extract itinerary information
  if (response.toLowerCase().includes('itinerary') || response.toLowerCase().includes('day 1')) {
    result.itinerary = extractItinerary(response, userMessage);
  }
  
  // Extract weather information
  if (response.toLowerCase().includes('weather') || response.toLowerCase().includes('temperature') || response.toLowerCase().includes('climate')) {
    result.weather = extractWeather(response);
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
    const uniqueLocations = [...new Set(locationNames)];
    
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
  const destinationMatches = userMessage.match(/(?:trip|visit|travel)\s+to\s+([A-Za-z\s]+)/i);
  const destination = destinationMatches ? destinationMatches[1].trim() : 'Your Destination';
  
  // Basic itinerary extraction
  const days = [];
  
  // Look for day markers in the response
  const dayRegex = /day\s+(\d+)[:\s]+([^\.]+)/gi;
  let dayMatch;
  
  while ((dayMatch = dayRegex.exec(response)) !== null) {
    const dayNumber = parseInt(dayMatch[1]);
    const dayTitle = dayMatch[2].trim();
    
    // Find activities for this day
    const activities = [];
    
    // Look for time markers (morning, afternoon, evening)
    const timeMarkers = ['morning', 'afternoon', 'evening'];
    
    for (const marker of timeMarkers) {
      const markerRegex = new RegExp(`${marker}[:\\s]+([^\\.,]+)`, 'i');
      const markerMatch = response.match(markerRegex);
      
      if (markerMatch) {
        activities.push({
          time: marker.charAt(0).toUpperCase() + marker.slice(1),
          description: markerMatch[1].trim(),
        });
      }
    }
    
    // If no specific time markers found, look for bullet points
    if (activities.length === 0) {
      const bulletRegex = /[•\\-\\*]\s+([^\\.,]+)/g;
      let bulletMatch;
      
      while ((bulletMatch = bulletRegex.exec(response)) !== null) {
        activities.push({
          time: 'Activity',
          description: bulletMatch[1].trim(),
        });
      }
    }
    
    // Add activities for the day
    days.push({
      day: dayNumber,
      title: dayTitle,
      activities: activities.length > 0 ? activities : [
        { time: 'Activity', description: 'Explore the destination' }
      ],
    });
  }
  
  // If no days found, create a simple itinerary
  if (days.length === 0) {
    days.push({
      day: 1,
      title: 'Exploration Day',
      activities: [
        { time: 'Morning', description: 'Visit local attractions' },
        { time: 'Afternoon', description: 'Try local cuisine' },
        { time: 'Evening', description: 'Enjoy the nightlife' },
      ],
    });
  }
  
  return {
    id: uuidv4(),
    title: `${destination} Itinerary`,
    destination,
    days,
  };
}

/**
 * Extract weather information from the response
 */
function extractWeather(response: string): any {
  // Look for location
  const locationMatch = response.match(/weather\s+in\s+([A-Za-z\s]+)/i) || 
                        response.match(/(?:in|at)\s+([A-Za-z\s]+)\s+(?:is|ranges|averages)/i);
  
  const location = locationMatch ? locationMatch[1].trim() : 'the destination';
  
  // Look for temperature
  const tempMatch = response.match(/(\d+)(?:\s*-\s*(\d+))?\s*°[CF]/i) || 
                    response.match(/temperatures\s+(?:of|around|between)\s+(\d+)(?:\s*-\s*(\d+))?/i);
  
  let tempMin = '';
  let tempMax = '';
  let tempAvg = '';
  
  if (tempMatch) {
    if (tempMatch[2]) {
      tempMin = `${tempMatch[1]}°C`;
      tempMax = `${tempMatch[2]}°C`;
      tempAvg = `${tempMatch[1]}-${tempMatch[2]}°C`;
    } else {
      tempAvg = `${tempMatch[1]}°C`;
    }
  } else {
    tempAvg = 'Varies by season';
  }
  
  // Look for conditions
  const conditionWords = ['sunny', 'rainy', 'cloudy', 'clear', 'stormy', 'snowy', 'hot', 'cold', 'warm', 'mild'];
  let conditions = 'Check local forecast';
  
  for (const word of conditionWords) {
    if (response.toLowerCase().includes(word)) {
      conditions = word.charAt(0).toUpperCase() + word.slice(1);
      break;
    }
  }
  
  // Look for season
  const seasonWords = ['spring', 'summer', 'autumn', 'fall', 'winter', 'monsoon', 'dry season', 'wet season'];
  let season = undefined;
  
  for (const word of seasonWords) {
    if (response.toLowerCase().includes(word)) {
      season = word.charAt(0).toUpperCase() + word.slice(1);
      break;
    }
  }
  
  // Determine icon
  let icon = '🌤️';
  
  if (conditions.toLowerCase().includes('rain') || conditions.toLowerCase().includes('storm')) {
    icon = '🌧️';
  } else if (conditions.toLowerCase().includes('snow')) {
    icon = '❄️';
  } else if (conditions.toLowerCase().includes('cloud')) {
    icon = '☁️';
  } else if (conditions.toLowerCase().includes('sun') || conditions.toLowerCase().includes('clear')) {
    icon = '☀️';
  } else if (season && season.toLowerCase().includes('spring')) {
    icon = '🌸';
  } else if (season && season.toLowerCase().includes('summer')) {
    icon = '🌞';
  } else if (season && (season.toLowerCase().includes('autumn') || season.toLowerCase().includes('fall'))) {
    icon = '🍂';
  } else if (season && season.toLowerCase().includes('winter')) {
    icon = '❄️';
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
  
  if (lowerMessage.includes('tokyo')) {
    return "Tokyo is a fascinating destination! In April, you can experience the beautiful cherry blossom season. The best viewing spots include Ueno Park, Shinjuku Gyoen, and along the Meguro River. Tokyo offers a blend of traditional and ultra-modern experiences. Would you like recommendations for a specific itinerary or information about particular attractions?";
  }
  
  if (lowerMessage.includes('itinerary') || lowerMessage.includes('plan')) {
    return "I'd be happy to help you create an itinerary! A good travel plan usually balances major attractions, local experiences, and some free time for exploration. For most city destinations, I recommend 3-4 days minimum. Could you tell me your destination, how many days you plan to stay, and if you have any particular interests (food, culture, nature, etc.)?";
  }
  
  if (lowerMessage.includes('food') || lowerMessage.includes('restaurant') || lowerMessage.includes('eat')) {
    return "Food is one of the best ways to experience local culture! When traveling, I recommend trying street food, visiting local markets, and experiencing both traditional restaurants and modern interpretations of local cuisine. Do you have a specific destination in mind for food recommendations?";
  }
  
  // Default response
  return "I'm your travel planning assistant and I'm here to help you plan your perfect trip! I can provide information about destinations, create personalized itineraries, and offer travel recommendations. Where would you like to go or what would you like to know about?";
}
