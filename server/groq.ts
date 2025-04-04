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
    const { responseText, locations, itinerary, weather, localFood, localAttractions } = await extractInformation(groqResponse, message, travelSession);
    
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
      localFood,
      localAttractions,
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
    - Local activity suggestions with hyperspecific details
    - Budget planning
    - Food recommendations with authentic local cuisine options
    
    INSTRUCTIONS:
    - When the user wants to plan a trip, ask for missing details: origin, destination, dates, budget.
    - If the user mentions a budget, convert it to USD if needed for consistency.
    - For flight searches, determine the IATA codes for airports when possible.
    - Create detailed day-by-day itineraries when requested with hyperspecific location names.
    - When suggesting activities, restaurants, or attractions, always provide actual location names, not generic descriptions.
    - For food recommendations, include authentic local dishes with their actual names, pricing in local currency, and where to find them.
    - For activities, include actual venue names, districts, neighborhoods, and pricing information.
    - Always include specific local details that only a knowledgeable local would know.
    - Respond conversationally and helpfully.
    - Always maintain context from the conversation history.
    
    HYPERSPECIFIC DETAILS FORMAT:
    When the user asks about a destination, include in your response information that can be extracted in this format:
    
    LOCAL_FOOD:[{name:"Dish Name",price:"Price range",description:"Brief description",location:"Restaurant or area name",image_keyword:"dish name food"}]
    
    LOCAL_ATTRACTIONS:[{name:"Attraction Name",price:"Entrance fee if any",description:"Brief description",location:"Exact location",hours:"Opening hours",image_keyword:"attraction name landmark"}]
    
    EXAMPLE PATTERN:
    User: "I want to travel from Hyderabad to Vietnam for 4 days with a budget of ₹100,000."
    Assistant: "I'd be happy to help you plan your 4-day trip from Hyderabad to Vietnam with a budget of ₹100,000 (approximately $1,200 USD). When would you like to travel? I'll need your departure and return dates to search for flights.
    
    While we're planning, Vietnam has so many amazing experiences! In Hanoi, you should try Bún Chả (grilled pork with rice noodles) at Bún Chả Hương Liên where Obama ate, it costs around 60,000-80,000 VND. For sightseeing, don't miss Hoan Kiem Lake and the Temple of Literature (Văn Miếu-Quốc Tử Giám), entrance fee 30,000 VND, open 8:00 AM-5:00 PM."
    
    LOCAL_FOOD:[{name:"Bún Chả",price:"60,000-80,000 VND",description:"Grilled pork with rice noodles",location:"Bún Chả Hương Liên",image_keyword:"bun cha vietnamese food"}]
    
    LOCAL_ATTRACTIONS:[{name:"Temple of Literature",price:"30,000 VND",description:"Vietnam's first national university",location:"58 Quốc Tử Giám, Hanoi",hours:"8:00 AM-5:00 PM",image_keyword:"temple of literature hanoi"}]`;
    
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
    localFood: [],
    localAttractions: []
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
  
  // Extract local food recommendations
  result.localFood = extractLocalFood(response);
  
  // Extract local attractions
  result.localAttractions = extractLocalAttractions(response);
  
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
  const days: {
    day: number;
    title: string;
    activities: {time: string; description: string}[];
  }[] = [];
  
  // Try to extract destination from user message or response
  const destinationMatches = 
    userMessage.match(/(?:trip|visit|travel|itinerary|plan)(?:\s+(?:to|for|in|at))\s+([A-Za-z\s,]+)(?:\s+for|\s+from|\s+on|\s+with|$)/i) ||
    response.match(/(?:trip|visit|travel|itinerary|plan)(?:\s+(?:to|for|in|at))\s+([A-Za-z\s,]+)(?:\s+for|\s+from|\s+on|\s+with|\.)/i) ||
    userMessage.match(/(?:in|to|for|at|visiting|explore)\s+([A-Z][a-zA-Z\s,]+)(?:\s+for|\s+from|\s+on|\s+with|$)/i) || 
    response.match(/(?:in|to|for|at|visiting|explore)\s+([A-Z][a-zA-Z\s,]+)(?:\s+for|\s+from|\s+on|\s+with|\.)/i);
    
  const destination = destinationMatches ? destinationMatches[1].trim() : 'Your Destination';
  console.log(`Extracted destination: ${destination}`);
  
  // Try to determine number of days
  const daysMatches = 
    response.match(/(\d+)(?:-|\s*)?day(?:\s+trip|\s+itinerary|\s+visit)?/i) ||
    userMessage.match(/(\d+)\s*(?:day|days)/i);
    
  const numberOfDays = daysMatches ? parseInt(daysMatches[1]) : 3;
  console.log(`Extracted number of days: ${numberOfDays}`);
  
  // Try multiple approaches to extract day information
  
  // Approach 1: Use regex to find day sections with activities
  try {
    const dayRegex = new RegExp("(?:^|\\n)\\s*(?:Day|DAY|day)\\s*(\\d+)(?:[-:]|\\s+)(.*?)(?=(?:\\n\\s*(?:Day|DAY|day)\\s*\\d+)|$)", "gs");
    let match;
    let content = response;
    
    // Replace newlines with a special character so we can use the 's' flag in our regex
    content = content.replace(/\n/g, "§");
    
    // Use a more manual approach since 's' flag isn't available
    const matches = content.match(new RegExp("(?:^|§)\\s*(?:Day|DAY|day)\\s*(\\d+)(?:[-:]|\\s+)(.*?)(?=(?:§\\s*(?:Day|DAY|day)\\s*\\d+)|$)", "g"));
    
    if (matches) {
      console.log(`Found ${matches.length} day sections using regex approach`);
      
      matches.forEach(section => {
        const dayMatch = section.match(/(?:Day|DAY|day)\s*(\d+)/);
        if (dayMatch) {
          const dayNumber = parseInt(dayMatch[1]);
          const dayContent = section.replace(/(?:^|§)\s*(?:Day|DAY|day)\s*\d+(?:[-:]|\s+)/, '').replace(/§/g, '\n');
          
          const activities: {time: string; description: string}[] = [];
          
          // Try multiple approaches to extract activities
          
          // First try: Look for time patterns like "9:00 AM - Visit the museum"
          const timeActRegex = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*[-:]\s*([^§]+)/g;
          let timeMatch;
          
          while ((timeMatch = timeActRegex.exec(dayContent.replace(/\n/g, '§'))) !== null) {
            activities.push({
              time: timeMatch[1].trim(),
              description: timeMatch[2].trim()
            });
          }
          
          // Second try: Look for morning/afternoon/evening patterns
          if (activities.length === 0) {
            const periodRegex = /(Morning|Afternoon|Evening|Night):\s*([^§]+)/gi;
            let periodMatch;
            
            while ((periodMatch = periodRegex.exec(dayContent.replace(/\n/g, '§'))) !== null) {
              const period = periodMatch[1].toLowerCase();
              let time = '12:00 PM';
              
              if (period === 'morning') time = '9:00 AM';
              else if (period === 'afternoon') time = '2:00 PM';
              else if (period === 'evening') time = '7:00 PM';
              else if (period === 'night') time = '9:00 PM';
              
              activities.push({
                time,
                description: periodMatch[2].trim()
              });
            }
          }
          
          // Third try: Look for bullet points
          if (activities.length === 0) {
            const bulletRegex = /[•*-]\s*([^§]+)/g;
            let bulletMatch;
            const timeSlots = ['8:00 AM', '10:30 AM', '1:00 PM', '3:30 PM', '6:00 PM', '8:30 PM'];
            let bulletIndex = 0;
            
            while ((bulletMatch = bulletRegex.exec(dayContent.replace(/\n/g, '§'))) !== null) {
              activities.push({
                time: timeSlots[bulletIndex % timeSlots.length],
                description: bulletMatch[1].trim()
              });
              bulletIndex++;
            }
          }
          
          // Fourth try: Just split by lines and try to make sense of each line
          if (activities.length === 0) {
            dayContent.split('\n').forEach((line, idx) => {
              const trimmed = line.trim();
              if (trimmed.length > 10) {
                const hour = 8 + (idx * 2) % 14;
                const timeStr = hour < 12 ? `${hour}:00 AM` : `${hour === 12 ? 12 : hour - 12}:00 PM`;
                
                activities.push({
                  time: timeStr,
                  description: trimmed
                });
              }
            });
          }
          
          // Generate a title for the day
          let title = `Day ${dayNumber}`;
          
          // Try to extract the title from the first line
          const lines = dayContent.split('\n');
          if (lines.length > 0 && lines[0].length > 0 && !lines[0].match(/^\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?/)) {
            // The first line isn't a time, so it might be a title
            const possibleTitle = lines[0].split(/[-:.]/, 1)[0].trim();
            if (possibleTitle.length > 0 && possibleTitle.length < 50) {
              title = possibleTitle;
            }
          } else if (activities.length > 0) {
            // Use the first activity to generate a theme-based title
            const firstAct = activities[0].description.toLowerCase();
            
            if (firstAct.includes('temple') || firstAct.includes('shrine') || firstAct.includes('palace'))
              title = 'Cultural Exploration';
            else if (firstAct.includes('market') || firstAct.includes('shop') || firstAct.includes('store'))
              title = 'Shopping & Local Markets';
            else if (firstAct.includes('museum') || firstAct.includes('art') || firstAct.includes('gallery'))
              title = 'Arts & Museums';
            else if (firstAct.includes('park') || firstAct.includes('garden') || firstAct.includes('nature'))
              title = 'Nature & Outdoors';
            else if (firstAct.includes('food') || firstAct.includes('restaurant') || firstAct.includes('cafe'))
              title = 'Food & Culinary Experiences';
            else {
              // Use the first activity description
              const shortDesc = activities[0].description.split(',')[0];
              title = shortDesc.length > 30 ? shortDesc.substring(0, 30) + '...' : shortDesc;
            }
          }
          
          if (activities.length > 0) {
            days.push({
              day: dayNumber,
              title,
              activities
            });
            console.log(`Added day ${dayNumber} with ${activities.length} activities`);
          }
        }
      });
    }
  } catch (error) {
    console.error("Error in regex approach:", error);
  }
  
  // Sort days by day number
  days.sort((a, b) => a.day - b.day);
  
  // If we didn't extract any days, create a default itinerary
  if (days.length === 0) {
    console.log("No days extracted, using default itinerary template");
    
    for (let i = 1; i <= numberOfDays; i++) {
      days.push({
        day: i,
        title: `Day ${i}${i === 1 ? ': Arrival & Orientation' : i === numberOfDays ? ': Farewell Day' : ''}`,
        activities: [
          { time: '9:00 AM', description: 'Start your day with local breakfast' },
          { time: '10:30 AM', description: i === 1 ? 'Visit main landmarks and attractions' : 'Explore local neighborhoods' },
          { time: '1:00 PM', description: 'Lunch at a popular local restaurant' },
          { time: '3:00 PM', description: i === 1 ? 'Cultural activity or museum visit' : 'Shopping or relaxation time' },
          { time: '6:00 PM', description: 'Free time to refresh and rest' },
          { time: '8:00 PM', description: i === numberOfDays ? 'Farewell dinner at a special restaurant' : 'Dinner and evening entertainment' }
        ]
      });
    }
  }
  
  // Generate the final itinerary object
  return {
    id: uuidv4(),
    title: `${days.length}-Day Itinerary for ${destination}`,
    destination,
    days
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

/**
 * Extract local food information from the response
 */
function extractLocalFood(response: string): any[] {
  const foodItems: any[] = [];
  
  try {
    // Look for the LOCAL_FOOD section in the response
    // Using a workaround for dotAll flag by replacing newlines with a character we can include in character class
    const normalizedResponse = response.replace(/\n/g, '◆');
    
    // Try multiple regex patterns to find the food section
    const foodSectionPatterns = [
      /LOCAL_FOOD:\s*\[(.*?)\]/i,
      /LOCAL FOOD:\s*\[(.*?)\]/i,
      /FOOD RECOMMENDATIONS:\s*\[(.*?)\]/i,
      /LOCAL_CUISINE:\s*\[(.*?)\]/i
    ];
    
    let foodMatch = null;
    for (const pattern of foodSectionPatterns) {
      foodMatch = normalizedResponse.match(pattern);
      if (foodMatch && foodMatch[1]) break;
    }
    
    if (foodMatch && foodMatch[1]) {
      try {
        // Clean up the JSON string before parsing
        let jsonStr = foodMatch[1]
          .replace(/◆/g, ' ')
          .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
          .replace(/'/g, '"')  // Replace single quotes with double quotes
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
        
        try {
          // Try to parse the JSON array
          const foodJson = JSON.parse(`[${jsonStr}]`);
          if (Array.isArray(foodJson) && foodJson.length > 0) {
            // Add IDs to each item
            const foodItemsWithIds = foodJson.map(item => ({
              ...item,
              id: uuidv4(),
              imageUrl: item.image_keyword ? 
                `https://source.unsplash.com/featured/?${encodeURIComponent(item.image_keyword)}&w=400&h=300` : 
                `https://source.unsplash.com/featured/?${encodeURIComponent(item.name + ' food')}&w=400&h=300`
            }));
            
            return foodItemsWithIds;
          }
        } catch (jsonError) {
          console.error('Error parsing food JSON from Groq response:', jsonError);
          
          // If normal JSON parsing fails, try a more lenient approach with regex
          const individualFoodRegexes = [
            /{[\s◆]*"?name"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*"?price"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*"?description"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*"?location"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*(?:,[\s◆]*"?image_keyword"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*)?}/g,
            /{[\s◆]*name[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*price[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*description[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*location[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*(?:,[\s◆]*image_keyword[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*)?}/g
          ];
          
          for (const regex of individualFoodRegexes) {
            let match;
            while ((match = regex.exec(foodMatch[1])) !== null) {
              foodItems.push({
                id: uuidv4(),
                name: match[1],
                price: match[2],
                description: match[3],
                location: match[4],
                imageUrl: match[5] ? 
                  `https://source.unsplash.com/featured/?${encodeURIComponent(match[5])}&w=400&h=300` : 
                  `https://source.unsplash.com/featured/?${encodeURIComponent(match[1] + ' food')}&w=400&h=300`
              });
            }
            if (foodItems.length > 0) break;
          }
        }
      } catch (preprocessError) {
        console.error('Error preprocessing food JSON:', preprocessError);
      }
    }
    
    // If we couldn't extract any food items, try a different approach
    if (foodItems.length === 0) {
      // Look for food sections in the text - common in model responses
      const foodSectionStarts = [
        'Local Food and Cuisine',
        'Local Cuisine',
        'Food Recommendations',
        'Must-Try Local Dishes',
        'Local Dishes to Try',
        'Popular Foods'
      ];
      
      for (const sectionStart of foodSectionStarts) {
        const sectionRegex = new RegExp(`${sectionStart}[:\\s]+(.*?)(?=\\n\\n|\\n[A-Z][A-Za-z\\s]+:|$)`, 's');
        const sectionMatch = response.match(sectionRegex);
        
        if (sectionMatch && sectionMatch[1]) {
          const foodSection = sectionMatch[1];
          // Look for numbered or bulleted list items
          const foodItemRegex = /(?:^\d+\.\s*|\*\s*|•\s*|-)?\s*([A-Z][A-Za-z\s-]+)(?:\s*[-:–]\s*|\s*\(([^)]+)\)\s*[-:–]\s*)([^.]+)/gm;
          
          let foodItemMatch;
          while ((foodItemMatch = foodItemRegex.exec(foodSection)) !== null) {
            const name = foodItemMatch[1].trim();
            const price = foodItemMatch[2] ? foodItemMatch[2].trim() : 'Variable';
            let description = foodItemMatch[3].trim();
            
            // Extract price from description if not already found
            if (price === 'Variable') {
              const priceMatch = description.match(/(\$+|\¥[0-9,\.]+|[0-9,\.]+\s*(?:USD|JPY|yen))/i);
              if (priceMatch) {
                description = description.replace(priceMatch[0], '').trim();
              }
            }
            
            // Avoid duplicates
            if (!foodItems.some(item => item.name.toLowerCase() === name.toLowerCase())) {
              foodItems.push({
                id: uuidv4(),
                name,
                price: price !== 'Variable' ? price : '$10-20',
                description: description || 'A local specialty',
                location: 'Local restaurant',
                imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(name + ' food')}&w=400&h=300`
              });
            }
          }
        }
        
        if (foodItems.length > 0) break;
      }
    }
    
    // Last resort: check if there are mentions of food in the text
    if (foodItems.length === 0) {
      const foodMentionRegex = /(?:local dish|popular food|must-try|food|cuisine)(?:\s+called|\s+is|\s+named)?\s+([A-Za-z\s-]+?)(?:[,.]\s+It's|[,.]\s+This|[,.]\s+Made|\s+at\s+([A-Za-z\s']+))/gi;
      
      let foodMention;
      while ((foodMention = foodMentionRegex.exec(response)) !== null) {
        const dishName = foodMention[1].trim();
        const restaurantName = foodMention[2] ? foodMention[2].trim() : 'Local restaurant';
        
        // Avoid duplicates
        if (!foodItems.some(item => item.name.toLowerCase() === dishName.toLowerCase())) {
          foodItems.push({
            id: uuidv4(),
            name: dishName,
            price: '$8-15',
            description: `A delicious local specialty with authentic flavors`,
            location: restaurantName,
            imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(dishName + ' food')}&w=400&h=300`
          });
        }
      }
    }
    
    // Make sure we have a good variety of food items
    return foodItems.map((item, index) => ({
      ...item,
      // Ensure unique IDs
      id: `food-${index}-${uuidv4().substring(0, 8)}`
    }));
  } catch (error) {
    console.error('Error extracting local food information:', error);
    return [];
  }
}

/**
 * Extract local attractions information from the response
 */
function extractLocalAttractions(response: string): any[] {
  const attractions: any[] = [];
  
  try {
    // Look for the LOCAL_ATTRACTIONS section in the response
    // Using a workaround for dotAll flag by replacing newlines with a character we can include in character class
    const normalizedResponse = response.replace(/\n/g, '◆');
    
    // Try multiple regex patterns to find the attractions section
    const attractionSectionPatterns = [
      /LOCAL_ATTRACTIONS:\s*\[(.*?)\]/i,
      /LOCAL ATTRACTIONS:\s*\[(.*?)\]/i,
      /ATTRACTIONS:\s*\[(.*?)\]/i,
      /ACTIVITIES:\s*\[(.*?)\]/i
    ];
    
    let attractionMatch = null;
    for (const pattern of attractionSectionPatterns) {
      attractionMatch = normalizedResponse.match(pattern);
      if (attractionMatch && attractionMatch[1]) break;
    }
    
    if (attractionMatch && attractionMatch[1]) {
      try {
        // Clean up the JSON string before parsing
        let jsonStr = attractionMatch[1]
          .replace(/◆/g, ' ')
          .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
          .replace(/'/g, '"')  // Replace single quotes with double quotes
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
        
        try {
          // Try to parse the JSON array
          const attractionsJson = JSON.parse(`[${jsonStr}]`);
          if (Array.isArray(attractionsJson) && attractionsJson.length > 0) {
            // Add IDs to each item
            const attractionsWithIds = attractionsJson.map(item => ({
              ...item,
              id: uuidv4(),
              imageUrl: item.image_keyword ? 
                `https://source.unsplash.com/featured/?${encodeURIComponent(item.image_keyword)}&w=400&h=300` : 
                `https://source.unsplash.com/featured/?${encodeURIComponent(item.name + ' attraction')}&w=400&h=300`,
              // Convert hours to duration format if needed
              duration: item.hours || item.duration || '2-3 hours'
            }));
            
            return attractionsWithIds;
          }
        } catch (jsonError) {
          console.error('Error parsing attractions JSON from Groq response:', jsonError);
          
          // If normal JSON parsing fails, try a more lenient approach with regex
          const individualAttractionRegexes = [
            /{[\s◆]*"?name"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*"?price"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*"?description"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*"?location"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*"?(?:hours|duration)"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*(?:,[\s◆]*"?image_keyword"?[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*)?}/g,
            /{[\s◆]*name[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*price[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*description[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*location[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*,[\s◆]*(?:hours|duration)[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*(?:,[\s◆]*image_keyword[\s◆]*:[\s◆]*"([^"]+)"[\s◆]*)?}/g
          ];
          
          for (const regex of individualAttractionRegexes) {
            let match;
            while ((match = regex.exec(attractionMatch[1])) !== null) {
              attractions.push({
                id: uuidv4(),
                name: match[1],
                price: match[2],
                description: match[3],
                location: match[4],
                duration: match[5],
                imageUrl: match[6] ? 
                  `https://source.unsplash.com/featured/?${encodeURIComponent(match[6])}&w=400&h=300` : 
                  `https://source.unsplash.com/featured/?${encodeURIComponent(match[1] + ' attraction')}&w=400&h=300`
              });
            }
            if (attractions.length > 0) break;
          }
        }
      } catch (preprocessError) {
        console.error('Error preprocessing attractions JSON:', preprocessError);
      }
    }
    
    // If we couldn't extract any attractions, try a different approach
    if (attractions.length === 0) {
      // Look for attraction sections in the text - common in model responses
      const attractionSectionStarts = [
        'Local Attractions',
        'Must-Visit Attractions',
        'Places to Visit',
        'Points of Interest',
        'Top Attractions',
        'Tourist Attractions'
      ];
      
      for (const sectionStart of attractionSectionStarts) {
        const sectionRegex = new RegExp(`${sectionStart}[:\\s]+(.*?)(?=\\n\\n|\\n[A-Z][A-Za-z\\s]+:|$)`, 's');
        const sectionMatch = response.match(sectionRegex);
        
        if (sectionMatch && sectionMatch[1]) {
          const attractionSection = sectionMatch[1];
          // Look for numbered or bulleted list items
          const attractionItemRegex = /(?:^\d+\.\s*|\*\s*|•\s*|-)?\s*([A-Z][A-Za-z\s-]+)(?:\s*[-:–]\s*|\s*\(([^)]+)\)\s*[-:–]\s*)([^.]+)/gm;
          
          let attractionItemMatch;
          while ((attractionItemMatch = attractionItemRegex.exec(attractionSection)) !== null) {
            const name = attractionItemMatch[1].trim();
            const price = attractionItemMatch[2] ? attractionItemMatch[2].trim() : 'Variable';
            let description = attractionItemMatch[3].trim();
            
            // Skip if this doesn't look like an attraction
            if (name.length < 4 || description.length < 10 ||
                /^(day|morning|afternoon|evening)$/i.test(name)) continue;
            
            // Extract price from description if not already found
            if (price === 'Variable') {
              const priceMatch = description.match(/(\$+|\¥[0-9,\.]+|[0-9,\.]+\s*(?:USD|JPY|yen))/i);
              if (priceMatch) {
                description = description.replace(priceMatch[0], '').trim();
              }
            }
            
            // Extract duration if mentioned
            let duration = '2-3 hours';
            const durationMatch = description.match(/(\d+(?:-\d+)?\s+(?:hour|hr|minute|min)s?)/i);
            if (durationMatch) {
              duration = durationMatch[1];
              description = description.replace(durationMatch[0], '').trim();
            }
            
            // Avoid duplicates
            if (!attractions.some(item => item.name.toLowerCase() === name.toLowerCase())) {
              attractions.push({
                id: uuidv4(),
                name,
                price: price !== 'Variable' ? price : 'Free - $20',
                description: description || 'A popular local attraction',
                location: 'City center',
                duration,
                imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(name)}&w=400&h=300`
              });
            }
          }
        }
        
        if (attractions.length > 0) break;
      }
    }
    
    // Last resort: check if there are mentions of attractions in the text
    if (attractions.length === 0) {
      const attractionMentionRegex = /(?:visit|explore|see|go to|attraction)(?:\s+the)?\s+([A-Za-z\s'-]+?)(?:[,.]\s+It's|[,.]\s+This|[,.]\s+Located|[,.]\s+Entry|\s+in\s+([A-Za-z\s']+))/gi;
      
      let attractionMention;
      while ((attractionMention = attractionMentionRegex.exec(response)) !== null) {
        const attractionName = attractionMention[1].trim();
        const locationName = attractionMention[2] ? attractionMention[2].trim() : 'City center';
        
        // Avoid duplicates and generic terms
        if (!attractions.some(item => item.name.toLowerCase() === attractionName.toLowerCase()) && 
            attractionName.length > 4 && 
            !attractionName.match(/^(area|city|district|morning|afternoon|evening)$/i)) {
          attractions.push({
            id: uuidv4(),
            name: attractionName,
            price: 'Free - $20',
            description: `An authentic local experience offering a glimpse into the local culture and heritage`,
            location: locationName,
            duration: '1-3 hours',
            imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(attractionName)}&w=400&h=300`
          });
        }
      }
    }
    
    // Make sure we have a good variety of attractions
    return attractions.map((item, index) => ({
      ...item,
      // Ensure unique IDs
      id: `attraction-${index}-${uuidv4().substring(0, 8)}`
    }));
  } catch (error) {
    console.error('Error extracting local attractions information:', error);
    return [];
  }
}
