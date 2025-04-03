// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Location types
export interface Location {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  locationType: 'food' | 'attraction' | 'nature' | 'landmark' | 'hotel';
  details?: Record<string, any>;
}

// Itinerary types
export interface ItineraryDay {
  day: number;
  title: string;
  activities: {
    time: string;
    description: string;
  }[];
}

export interface Itinerary {
  id: string;
  title: string;
  destination: string;
  days: ItineraryDay[];
}

// Weather types
export interface Weather {
  location: string;
  temperature: {
    average: string;
    min: string;
    max: string;
  };
  conditions: string;
  season?: string;
  icon: string;
}

// API response types
export interface ChatResponse {
  id: string;
  message: Message;
  locations?: Location[];
  itinerary?: Itinerary;
  weather?: Weather;
}

// Map marker type
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  type: string;
}
