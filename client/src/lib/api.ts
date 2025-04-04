import { Message, ChatResponse, Weather } from './types';

// Function to send a message to the server
export async function sendMessage(message: string): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Function to get location information
export async function getLocationInfo(location: string): Promise<any> {
  try {
    const response = await fetch(`/api/location?q=${encodeURIComponent(location)}`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting location info:', error);
    throw error;
  }
}

// Function to save an itinerary
export async function saveItinerary(itinerary: any): Promise<any> {
  try {
    const response = await fetch('/api/itinerary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itinerary),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving itinerary:', error);
    throw error;
  }
}

// Function to get chat history
export async function getChatHistory(): Promise<Message[]> {
  try {
    const response = await fetch('/api/chat/history');

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
}

// Function to clear chat history (for "New Chat" functionality)
export async function clearChatHistory(): Promise<boolean> {
  try {
    const response = await fetch('/api/chat/history', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return false;
  }
}

// Function to search for flights
export async function searchFlights(
  origin: string,
  destination: string,
  departDate: string,
  returnDate: string,
  adults: number = 1,
  maxPrice?: number
): Promise<any[]> {
  try {
    let url = `/api/flights?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departDate=${departDate}&returnDate=${returnDate}&adults=${adults}`;
    
    if (maxPrice) {
      url += `&maxPrice=${maxPrice}`;
    }
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching flights:', error);
    return [];
  }
}

// Function to search for hotels
export async function searchHotels(
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number = 1,
  rooms: number = 1
): Promise<any[]> {
  try {
    const url = `/api/hotels?location=${encodeURIComponent(location)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&rooms=${rooms}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching hotels:', error);
    return [];
  }
}

// Function to get weather for a location
export async function getWeatherForLocation(
  location: string,
  days: number = 3
): Promise<Weather | null> {
  try {
    const url = `/api/weather?location=${encodeURIComponent(location)}&days=${days}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting weather:', error);
    return null;
  }
}
