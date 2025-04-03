import { Location } from '@shared/schema';

// Cache for location searches
const cache = new Map<string, any>();

/**
 * Search for a location using Nominatim
 */
export async function searchLocation(query: string): Promise<any> {
  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  try {
    // Use Nominatim API for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      {
        headers: {
          'User-Agent': 'TravelAssistant/1.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format results
    const locations = data.map((item: any) => ({
      id: item.place_id,
      name: item.display_name.split(',')[0],
      fullName: item.display_name,
      latitude: item.lat,
      longitude: item.lon,
      locationType: determineLocationType(item.class, item.type),
      details: {
        class: item.class,
        type: item.type,
        importance: item.importance,
      },
    }));
    
    // Cache results
    cache.set(cacheKey, locations);
    
    return locations;
  } catch (error) {
    console.error('Error searching location:', error);
    throw error;
  }
}

/**
 * Determine location type from Nominatim class and type
 */
function determineLocationType(className: string, type: string): string {
  if (['restaurant', 'bar', 'cafe', 'pub', 'food_court'].includes(type)) {
    return 'food';
  }
  
  if (['hotel', 'hostel', 'motel', 'guest_house'].includes(type)) {
    return 'hotel';
  }
  
  if (['park', 'forest', 'nature_reserve', 'beach'].includes(type)) {
    return 'nature';
  }
  
  if (['tourism', 'museum', 'castle', 'monument', 'artwork', 'attraction'].includes(type)) {
    return 'attraction';
  }
  
  if (['town', 'city', 'village', 'state', 'country'].includes(type)) {
    return 'landmark';
  }
  
  return 'landmark';
}
