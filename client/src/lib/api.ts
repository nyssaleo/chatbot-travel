import { Message, ChatResponse } from './types';

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
