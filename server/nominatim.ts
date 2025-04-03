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

  // Check if this is one of our predefined mock locations
  const mockLocations = getMockLocationsForQuery(query);
  if (mockLocations && mockLocations.length > 0) {
    // Cache results
    cache.set(cacheKey, mockLocations);
    return mockLocations;
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
      id: item.place_id || Math.floor(Math.random() * 1000000).toString(),
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
    
    // Add nearby places if we have a main location
    if (locations.length > 0 && !query.toLowerCase().includes('restaurant') && !query.toLowerCase().includes('hotel')) {
      const mainLocation = locations[0];
      const nearbyPlaces = getNearbyPlacesForLocation(mainLocation.name, {
        lat: parseFloat(mainLocation.latitude),
        lon: parseFloat(mainLocation.longitude)
      });
      
      if (nearbyPlaces && nearbyPlaces.length > 0) {
        locations.push(...nearbyPlaces);
      }
    }
    
    // Cache results
    cache.set(cacheKey, locations);
    
    return locations;
  } catch (error) {
    console.error('Error searching location:', error);
    
    // If API fails, return mock data for common locations
    const fallbackMockLocations = getFallbackMockLocation(query);
    if (fallbackMockLocations.length > 0) {
      cache.set(cacheKey, fallbackMockLocations);
      return fallbackMockLocations;
    }
    
    throw error;
  }
}

/**
 * Get mock locations for predefined queries
 */
function getMockLocationsForQuery(query: string): any[] {
  const lowerQuery = query.toLowerCase();
  
  // Tokyo specific locations
  if (lowerQuery.includes('tokyo')) {
    return [
      {
        id: '1001',
        name: 'Tokyo',
        fullName: 'Tokyo, Japan',
        latitude: '35.6762',
        longitude: '139.6503',
        locationType: 'landmark',
        details: {
          population: '13.96 million',
          country: 'Japan',
          importance: 0.9,
        },
      },
      {
        id: '1002',
        name: 'Tokyo Skytree',
        fullName: 'Tokyo Skytree, Sumida, Tokyo, Japan',
        latitude: '35.7101',
        longitude: '139.8107',
        locationType: 'attraction',
        details: {
          height: '634m',
          type: 'tower',
          importance: 0.7,
        },
      },
      {
        id: '1003',
        name: 'Meiji Shrine',
        fullName: 'Meiji Shrine, Shibuya, Tokyo, Japan',
        latitude: '35.6764',
        longitude: '139.6993',
        locationType: 'attraction',
        details: {
          type: 'shrine',
          importance: 0.8,
        },
      },
      {
        id: '1004',
        name: 'Tsukiji Outer Market',
        fullName: 'Tsukiji Outer Market, Chuo, Tokyo, Japan',
        latitude: '35.6654',
        longitude: '139.7707',
        locationType: 'food',
        details: {
          type: 'market',
          importance: 0.7,
        },
      },
      {
        id: '1005',
        name: 'Shinjuku Gyoen National Garden',
        fullName: 'Shinjuku Gyoen National Garden, Shinjuku, Tokyo, Japan',
        latitude: '35.6851',
        longitude: '139.7100',
        locationType: 'nature',
        details: {
          type: 'park',
          importance: 0.75,
        },
      }
    ];
  }

  // Paris specific locations
  if (lowerQuery.includes('paris')) {
    return [
      {
        id: '2001',
        name: 'Paris',
        fullName: 'Paris, Île-de-France, France',
        latitude: '48.8566',
        longitude: '2.3522',
        locationType: 'landmark',
        details: {
          population: '2.16 million',
          country: 'France',
          importance: 0.9,
        },
      },
      {
        id: '2002',
        name: 'Eiffel Tower',
        fullName: 'Eiffel Tower, Paris, France',
        latitude: '48.8584',
        longitude: '2.2945',
        locationType: 'attraction',
        details: {
          height: '330m',
          type: 'tower',
          importance: 0.9,
        },
      },
      {
        id: '2003',
        name: 'Louvre Museum',
        fullName: 'Louvre Museum, Paris, France',
        latitude: '48.8606',
        longitude: '2.3376',
        locationType: 'attraction',
        details: {
          type: 'museum',
          importance: 0.85,
        },
      },
      {
        id: '2004',
        name: 'Le Marais',
        fullName: 'Le Marais, Paris, France',
        latitude: '48.8559',
        longitude: '2.3604',
        locationType: 'food',
        details: {
          type: 'district',
          importance: 0.7,
        },
      },
      {
        id: '2005',
        name: 'Luxembourg Gardens',
        fullName: 'Luxembourg Gardens, Paris, France',
        latitude: '48.8462',
        longitude: '2.3371',
        locationType: 'nature',
        details: {
          type: 'park',
          importance: 0.75,
        },
      }
    ];
  }

  // NYC specific locations
  if (lowerQuery.includes('new york') || lowerQuery.includes('nyc')) {
    return [
      {
        id: '3001',
        name: 'New York City',
        fullName: 'New York City, New York, USA',
        latitude: '40.7128',
        longitude: '-74.0060',
        locationType: 'landmark',
        details: {
          population: '8.4 million',
          country: 'USA',
          importance: 0.9,
        },
      },
      {
        id: '3002',
        name: 'Empire State Building',
        fullName: 'Empire State Building, New York, USA',
        latitude: '40.7484',
        longitude: '-73.9857',
        locationType: 'attraction',
        details: {
          height: '381m',
          type: 'skyscraper',
          importance: 0.85,
        },
      },
      {
        id: '3003',
        name: 'Central Park',
        fullName: 'Central Park, Manhattan, New York, USA',
        latitude: '40.7812',
        longitude: '-73.9665',
        locationType: 'nature',
        details: {
          type: 'park',
          importance: 0.85,
        },
      },
      {
        id: '3004',
        name: 'Katz\'s Delicatessen',
        fullName: 'Katz\'s Delicatessen, Lower East Side, New York, USA',
        latitude: '40.7223',
        longitude: '-73.9874',
        locationType: 'food',
        details: {
          type: 'restaurant',
          importance: 0.7,
        },
      },
      {
        id: '3005',
        name: 'Metropolitan Museum of Art',
        fullName: 'Metropolitan Museum of Art, New York, USA',
        latitude: '40.7794',
        longitude: '-73.9632',
        locationType: 'attraction',
        details: {
          type: 'museum',
          importance: 0.8,
        },
      }
    ];
  }

  // Barcelona specific locations
  if (lowerQuery.includes('barcelona')) {
    return [
      {
        id: '4001',
        name: 'Barcelona',
        fullName: 'Barcelona, Catalonia, Spain',
        latitude: '41.3851',
        longitude: '2.1734',
        locationType: 'landmark',
        details: {
          population: '1.6 million',
          country: 'Spain',
          importance: 0.9,
        },
      },
      {
        id: '4002',
        name: 'Sagrada Família',
        fullName: 'Sagrada Família, Barcelona, Spain',
        latitude: '41.4036',
        longitude: '2.1744',
        locationType: 'attraction',
        details: {
          type: 'church',
          importance: 0.9,
        },
      },
      {
        id: '4003',
        name: 'Park Güell',
        fullName: 'Park Güell, Barcelona, Spain',
        latitude: '41.4145',
        longitude: '2.1527',
        locationType: 'nature',
        details: {
          type: 'park',
          importance: 0.8,
        },
      },
      {
        id: '4004',
        name: 'La Boqueria Market',
        fullName: 'La Boqueria Market, Barcelona, Spain',
        latitude: '41.3817',
        longitude: '2.1715',
        locationType: 'food',
        details: {
          type: 'market',
          importance: 0.75,
        },
      },
      {
        id: '4005',
        name: 'Gothic Quarter',
        fullName: 'Gothic Quarter, Barcelona, Spain',
        latitude: '41.3833',
        longitude: '2.1777',
        locationType: 'attraction',
        details: {
          type: 'district',
          importance: 0.85,
        },
      }
    ];
  }

  // Restaurant search
  if (lowerQuery.includes('restaurant') || lowerQuery.includes('food') || lowerQuery.includes('eat')) {
    // Extract city name if present
    const cityMatches = lowerQuery.match(/(?:in|at)\s+([a-zA-Z\s]+)(?:$|\?|\.)/);
    const city = cityMatches ? cityMatches[1].trim() : "";
    
    if (city.toLowerCase().includes('tokyo')) {
      return [
        {
          id: '5001',
          name: 'Sushi Dai',
          fullName: 'Sushi Dai, Tsukiji, Tokyo, Japan',
          latitude: '35.6654',
          longitude: '139.7702',
          locationType: 'food',
          details: {
            cuisine: 'Sushi',
            price: '$$',
            importance: 0.8,
          },
        },
        {
          id: '5002',
          name: 'Ichiran Shinjuku',
          fullName: 'Ichiran Ramen, Shinjuku, Tokyo, Japan',
          latitude: '35.6938',
          longitude: '139.7032',
          locationType: 'food',
          details: {
            cuisine: 'Ramen',
            price: '$',
            importance: 0.75,
          },
        },
        {
          id: '5003',
          name: 'Gonpachi Nishiazabu',
          fullName: 'Gonpachi Nishiazabu, Minato, Tokyo, Japan',
          latitude: '35.6577',
          longitude: '139.7222',
          locationType: 'food',
          details: {
            cuisine: 'Japanese',
            price: '$$',
            importance: 0.7,
          },
        }
      ];
    } else if (city.toLowerCase().includes('paris')) {
      return [
        {
          id: '6001',
          name: 'Le Jules Verne',
          fullName: 'Le Jules Verne, Eiffel Tower, Paris, France',
          latitude: '48.8583',
          longitude: '2.2944',
          locationType: 'food',
          details: {
            cuisine: 'French',
            price: '$$$$',
            importance: 0.8,
          },
        },
        {
          id: '6002',
          name: 'L\'Atelier de Joël Robuchon',
          fullName: 'L\'Atelier de Joël Robuchon, Paris, France',
          latitude: '48.8534',
          longitude: '2.3483',
          locationType: 'food',
          details: {
            cuisine: 'French',
            price: '$$$$',
            importance: 0.8,
          },
        },
        {
          id: '6003',
          name: 'Café de Flore',
          fullName: 'Café de Flore, Saint-Germain-des-Prés, Paris, France',
          latitude: '48.8539',
          longitude: '2.3324',
          locationType: 'food',
          details: {
            cuisine: 'Café',
            price: '$$',
            importance: 0.75,
          },
        }
      ];
    } else {
      // Generic restaurant recommendations
      return [
        {
          id: '7001',
          name: 'The Central Bistro',
          fullName: 'The Central Bistro, City Center',
          latitude: '40.7580',
          longitude: '-73.9855',
          locationType: 'food',
          details: {
            cuisine: 'International',
            price: '$$',
            importance: 0.7,
          },
        },
        {
          id: '7002',
          name: 'Waterfront Seafood',
          fullName: 'Waterfront Seafood, Harbor District',
          latitude: '40.7023',
          longitude: '-74.0150',
          locationType: 'food',
          details: {
            cuisine: 'Seafood',
            price: '$$$',
            importance: 0.75,
          },
        },
        {
          id: '7003',
          name: 'Old Town Café',
          fullName: 'Old Town Café, Historic District',
          latitude: '40.7128',
          longitude: '-74.0060',
          locationType: 'food',
          details: {
            cuisine: 'Café',
            price: '$',
            importance: 0.65,
          },
        }
      ];
    }
  }

  // Hotel search
  if (lowerQuery.includes('hotel') || lowerQuery.includes('accommodation') || lowerQuery.includes('stay')) {
    // Extract city name if present
    const cityMatches = lowerQuery.match(/(?:in|at)\s+([a-zA-Z\s]+)(?:$|\?|\.)/);
    const city = cityMatches ? cityMatches[1].trim() : "";
    
    if (city.toLowerCase().includes('tokyo')) {
      return [
        {
          id: '8001',
          name: 'Park Hyatt Tokyo',
          fullName: 'Park Hyatt Tokyo, Shinjuku, Tokyo, Japan',
          latitude: '35.6861',
          longitude: '139.6922',
          locationType: 'hotel',
          details: {
            stars: 5,
            price: '$$$$',
            importance: 0.85,
          },
        },
        {
          id: '8002',
          name: 'Hotel Okura Tokyo',
          fullName: 'Hotel Okura Tokyo, Minato, Tokyo, Japan',
          latitude: '35.6692',
          longitude: '139.7408',
          locationType: 'hotel',
          details: {
            stars: 5,
            price: '$$$',
            importance: 0.8,
          },
        },
        {
          id: '8003',
          name: 'Shinjuku Granbell Hotel',
          fullName: 'Shinjuku Granbell Hotel, Tokyo, Japan',
          latitude: '35.6932',
          longitude: '139.7013',
          locationType: 'hotel',
          details: {
            stars: 4,
            price: '$$',
            importance: 0.7,
          },
        }
      ];
    } else if (city.toLowerCase().includes('paris')) {
      return [
        {
          id: '9001',
          name: 'Ritz Paris',
          fullName: 'Ritz Paris, Place Vendôme, Paris, France',
          latitude: '48.8683',
          longitude: '2.3282',
          locationType: 'hotel',
          details: {
            stars: 5,
            price: '$$$$',
            importance: 0.9,
          },
        },
        {
          id: '9002',
          name: 'Hôtel Le Meurice',
          fullName: 'Hôtel Le Meurice, Paris, France',
          latitude: '48.8651',
          longitude: '2.3283',
          locationType: 'hotel',
          details: {
            stars: 5,
            price: '$$$$',
            importance: 0.85,
          },
        },
        {
          id: '9003',
          name: 'Citadines Tour Eiffel Paris',
          fullName: 'Citadines Tour Eiffel Paris, Paris, France',
          latitude: '48.8502',
          longitude: '2.2934',
          locationType: 'hotel',
          details: {
            stars: 3,
            price: '$$',
            importance: 0.7,
          },
        }
      ];
    } else {
      // Generic hotel recommendations
      return [
        {
          id: '10001',
          name: 'Grand Central Hotel',
          fullName: 'Grand Central Hotel, City Center',
          latitude: '40.7505',
          longitude: '-73.9934',
          locationType: 'hotel',
          details: {
            stars: 5,
            price: '$$$',
            importance: 0.8,
          },
        },
        {
          id: '10002',
          name: 'Parkview Inn',
          fullName: 'Parkview Inn, Park District',
          latitude: '40.7812',
          longitude: '-73.9665',
          locationType: 'hotel',
          details: {
            stars: 4,
            price: '$$',
            importance: 0.75,
          },
        },
        {
          id: '10003',
          name: 'Harbor Budget Stay',
          fullName: 'Harbor Budget Stay, Harbor District',
          latitude: '40.7033',
          longitude: '-74.0170',
          locationType: 'hotel',
          details: {
            stars: 2,
            price: '$',
            importance: 0.6,
          },
        }
      ];
    }
  }

  return [];
}

/**
 * Get nearby attractions, restaurants and hotels for a main location
 */
function getNearbyPlacesForLocation(locationName: string, coordinates: {lat: number, lon: number}): any[] {
  const lowerName = locationName.toLowerCase();
  const results = [];
  
  // For Tokyo
  if (lowerName.includes('tokyo')) {
    // Add some restaurants
    results.push(
      {
        id: Math.floor(Math.random() * 1000000).toString(),
        name: 'Gonpachi Nishiazabu',
        fullName: 'Gonpachi Nishiazabu, Minato, Tokyo, Japan',
        latitude: (coordinates.lat + 0.01).toString(),
        longitude: (coordinates.lon + 0.005).toString(),
        locationType: 'food',
        details: {
          cuisine: 'Japanese',
          price: '$$',
          importance: 0.7,
        },
      },
      {
        id: Math.floor(Math.random() * 1000000).toString(),
        name: 'Ichiran Shinjuku',
        fullName: 'Ichiran Ramen, Shinjuku, Tokyo, Japan',
        latitude: (coordinates.lat - 0.008).toString(),
        longitude: (coordinates.lon + 0.01).toString(),
        locationType: 'food',
        details: {
          cuisine: 'Ramen',
          price: '$',
          importance: 0.75,
        },
      }
    );
    
    // Add some hotels
    results.push(
      {
        id: Math.floor(Math.random() * 1000000).toString(),
        name: 'Shinjuku Granbell Hotel',
        fullName: 'Shinjuku Granbell Hotel, Tokyo, Japan',
        latitude: (coordinates.lat + 0.006).toString(),
        longitude: (coordinates.lon - 0.007).toString(),
        locationType: 'hotel',
        details: {
          stars: 4,
          price: '$$',
          importance: 0.7,
        },
      }
    );
  }
  
  // For Paris
  else if (lowerName.includes('paris')) {
    // Add some restaurants
    results.push(
      {
        id: Math.floor(Math.random() * 1000000).toString(),
        name: 'Café de Flore',
        fullName: 'Café de Flore, Saint-Germain-des-Prés, Paris, France',
        latitude: (coordinates.lat - 0.007).toString(),
        longitude: (coordinates.lon + 0.009).toString(),
        locationType: 'food',
        details: {
          cuisine: 'Café',
          price: '$$',
          importance: 0.75,
        },
      },
      {
        id: Math.floor(Math.random() * 1000000).toString(),
        name: 'Le Comptoir du Relais',
        fullName: 'Le Comptoir du Relais, Saint-Germain, Paris, France',
        latitude: (coordinates.lat + 0.005).toString(),
        longitude: (coordinates.lon - 0.008).toString(),
        locationType: 'food',
        details: {
          cuisine: 'French',
          price: '$$$',
          importance: 0.8,
        },
      }
    );
    
    // Add some hotels
    results.push(
      {
        id: Math.floor(Math.random() * 1000000).toString(),
        name: 'Hôtel Plaza Athénée',
        fullName: 'Hôtel Plaza Athénée, Paris, France',
        latitude: (coordinates.lat + 0.004).toString(),
        longitude: (coordinates.lon + 0.006).toString(),
        locationType: 'hotel',
        details: {
          stars: 5,
          price: '$$$$',
          importance: 0.85,
        },
      }
    );
  }
  
  // For generic locations, add generic places
  else {
    // Add some generic restaurants
    results.push(
      {
        id: Math.floor(Math.random() * 1000000).toString(),
        name: 'Local Bistro',
        fullName: 'Local Bistro, Near ' + locationName,
        latitude: (coordinates.lat + 0.008).toString(),
        longitude: (coordinates.lon - 0.006).toString(),
        locationType: 'food',
        details: {
          cuisine: 'Local',
          price: '$$',
          importance: 0.7,
        },
      }
    );
    
    // Add some generic hotels
    results.push(
      {
        id: Math.floor(Math.random() * 1000000).toString(),
        name: 'Central Hotel',
        fullName: 'Central Hotel, Near ' + locationName,
        latitude: (coordinates.lat - 0.005).toString(),
        longitude: (coordinates.lon + 0.007).toString(),
        locationType: 'hotel',
        details: {
          stars: 4,
          price: '$$',
          importance: 0.75,
        },
      }
    );
  }
  
  return results;
}

/**
 * Get fallback mock location when API fails
 */
function getFallbackMockLocation(query: string): any[] {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('tokyo')) {
    return [
      {
        id: '101',
        name: 'Tokyo',
        fullName: 'Tokyo, Japan',
        latitude: '35.6762',
        longitude: '139.6503',
        locationType: 'landmark',
        details: {
          country: 'Japan',
          importance: 0.9,
        },
      }
    ];
  }
  
  if (lowerQuery.includes('paris')) {
    return [
      {
        id: '102',
        name: 'Paris',
        fullName: 'Paris, France',
        latitude: '48.8566',
        longitude: '2.3522',
        locationType: 'landmark',
        details: {
          country: 'France',
          importance: 0.9,
        },
      }
    ];
  }
  
  if (lowerQuery.includes('new york') || lowerQuery.includes('nyc')) {
    return [
      {
        id: '103',
        name: 'New York City',
        fullName: 'New York City, USA',
        latitude: '40.7128',
        longitude: '-74.0060',
        locationType: 'landmark',
        details: {
          country: 'USA',
          importance: 0.9,
        },
      }
    ];
  }
  
  if (lowerQuery.includes('barcelona')) {
    return [
      {
        id: '104',
        name: 'Barcelona',
        fullName: 'Barcelona, Spain',
        latitude: '41.3851',
        longitude: '2.1734',
        locationType: 'landmark',
        details: {
          country: 'Spain',
          importance: 0.9,
        },
      }
    ];
  }
  
  // If no specific city is recognized, return an empty array
  return [];
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
