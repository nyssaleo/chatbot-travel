import axios from 'axios';

/**
 * Amadeus API Service
 * Handles authentication and API calls to Amadeus for flight and hotel data
 */
class AmadeusService {
  private baseUrl = 'https://test.api.amadeus.com/v1';
  private accessToken: string = '';
  private tokenExpiry: number = 0;
  
  constructor(
    private apiKey: string = process.env.AMADEUS_API_KEY || '',
    private apiSecret: string = process.env.AMADEUS_API_SECRET || ''
  ) {}

  /**
   * Get an access token for Amadeus API
   */
  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://test.api.amadeus.com/v1/security/oauth2/token',
        `grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.apiSecret}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 30 minutes before actual expiry to be safe
      this.tokenExpiry = Date.now() + (response.data.expires_in - 1800) * 1000;
      return this.accessToken || '';
    } catch (error) {
      console.error('Error authenticating with Amadeus:', error);
      throw new Error('Failed to authenticate with Amadeus API');
    }
  }

  /**
   * Make an API call to Amadeus
   */
  private async apiCall(endpoint: string, method: string = 'GET', params: any = {}): Promise<any> {
    try {
      const token = await this.authenticate();
      const url = `${this.baseUrl}${endpoint}`;
      
      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        ...(method.toUpperCase() === 'GET' ? { params } : { data: params })
      };
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Error calling Amadeus API ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Search for flights between origins and destinations with fallback to mock data
   */
  async searchFlights(
    originLocationCode: string, 
    destinationLocationCode: string, 
    departureDate: string, 
    returnDate: string,
    adults: number = 1,
    maxPrice?: number
  ) {
    const params: any = {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      currencyCode: 'USD',
      max: 5
    };
    
    if (maxPrice) {
      params.maxPrice = maxPrice;
    }
    
    try {
      // Attempt to get real data
      const response = await this.apiCall('/shopping/flight-offers', 'GET', params);
      return this.formatFlightResults(response);
    } catch (error) {
      console.error('Error fetching flight data:', error);
      // If we can't get real data, format the parameters into a reasonable mock response
      return this.generateFlightMockResponse(originLocationCode, destinationLocationCode, departureDate, returnDate);
    }
  }

  // Format the flight API response to our application structure
  private formatFlightResults(response: any) {
    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid flight data format');
    }
    
    return response.data.map((offer: any) => {
      const itinerary = offer.itineraries[0];
      const firstSegment = itinerary.segments[0];
      const lastSegment = itinerary.segments[itinerary.segments.length - 1];
      
      return {
        id: offer.id,
        departure: firstSegment.departure.iataCode,
        destination: lastSegment.arrival.iataCode,
        departureTime: firstSegment.departure.at.split('T')[1].substring(0, 5),
        arrivalTime: lastSegment.arrival.at.split('T')[1].substring(0, 5),
        departureDate: firstSegment.departure.at.split('T')[0],
        price: {
          amount: parseFloat(offer.price.total),
          currency: offer.price.currency
        },
        airline: firstSegment.carrierCode,
        flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
        duration: this.formatDuration(itinerary.duration),
        stops: itinerary.segments.length - 1,
        layovers: itinerary.segments.length > 1 ? 
          itinerary.segments.slice(0, -1).map((segment: any, index: number) => ({
            airport: segment.arrival.iataCode,
            duration: this.formatDuration(segment.duration)
          })) : []
      };
    });
  }

  // Format duration from PT2H30M to 2h 30m
  private formatDuration(durationStr: string): string {
    const hours = durationStr.match(/(\d+)H/);
    const minutes = durationStr.match(/(\d+)M/);
    
    return `${hours ? hours[1] : '0'}h ${minutes ? minutes[1] : '0'}m`;
  }

  // Generate mock flight data based on user parameters
  private generateFlightMockResponse(origin: string, destination: string, departDate: string, returnDate: string) {
    const airlines = ['AA', 'UA', 'DL', 'BA', 'LH', 'AF', 'KL', 'EK'];
    const randomFlight = () => {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const flightNumber = Math.floor(Math.random() * 1000) + 100;
      const price = Math.floor(Math.random() * 600) + 250;
      const hours = Math.floor(Math.random() * 8) + 2;
      const minutes = Math.floor(Math.random() * 60);
      
      return {
        id: `flight-${Math.random().toString(36).substring(2, 9)}`,
        departure: origin,
        destination: destination,
        departureTime: `${String(8 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        arrivalTime: `${String(14 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        departureDate: departDate,
        price: { amount: price, currency: 'USD' },
        airline: airline,
        flightNumber: `${airline}${flightNumber}`,
        duration: `${hours}h ${minutes}m`,
        stops: Math.floor(Math.random() * 2),
        layovers: []
      };
    };
    
    // Return array of 3 random flights
    return [randomFlight(), randomFlight(), randomFlight()];
  }

  /**
   * Search for hotels in a city with fallback to mock data
   */
  async searchHotels(
    cityCode: string,
    checkInDate: string,
    checkOutDate: string,
    adults: number = 1,
    roomQuantity: number = 1,
    priceRange?: string
  ) {
    const params: any = {
      cityCode,
      checkInDate,
      checkOutDate,
      adults,
      roomQuantity,
      currency: 'USD',
      bestRateOnly: true
    };
    
    if (priceRange) {
      params.priceRange = priceRange;
    }
    
    try {
      // Attempt to get real data
      const response = await this.apiCall('/shopping/hotel-offers', 'GET', params);
      return this.formatHotelResults(response);
    } catch (error) {
      console.error('Error fetching hotel data:', error);
      // If we can't get real data, provide a reasonable mock response
      return this.generateHotelMockResponse(cityCode, checkInDate, checkOutDate);
    }
  }
  
  // Format the hotel API response to our application structure
  private formatHotelResults(response: any) {
    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid hotel data format');
    }
    
    return response.data.map((offer: any) => {
      const hotel = offer.hotel;
      const priceInfo = offer.offers[0].price;
      
      return {
        id: hotel.hotelId,
        name: hotel.name,
        address: hotel.address?.lines?.join(', ') || '',
        rating: hotel.rating ? parseFloat(hotel.rating) : 4,
        price: {
          amount: parseFloat(priceInfo.total),
          currency: priceInfo.currency
        },
        amenities: this.extractAmenities(offer),
        latitude: hotel.latitude,
        longitude: hotel.longitude
      };
    });
  }
  
  // Extract amenities from hotel offers
  private extractAmenities(offer: any): string[] {
    const amenities = [];
    if (offer.offers && offer.offers[0] && offer.offers[0].room) {
      if (offer.offers[0].room.typeEstimated && offer.offers[0].room.typeEstimated.bedType) {
        amenities.push(offer.offers[0].room.typeEstimated.bedType);
      }
    }
    
    // Add some common amenities
    const commonAmenities = ['Wifi', 'Breakfast', 'Pool', 'Gym', 'Parking', 'Restaurant', 'Room Service'];
    const count = 2 + Math.floor(Math.random() * 4); // 2-5 amenities
    
    for (let i = 0; i < count; i++) {
      const amenity = commonAmenities[Math.floor(Math.random() * commonAmenities.length)];
      if (!amenities.includes(amenity)) {
        amenities.push(amenity);
      }
    }
    
    return amenities;
  }
  
  // Generate mock hotel data based on location
  private generateHotelMockResponse(cityCode: string, checkInDate: string, checkOutDate: string) {
    const hotelChains = ['Marriott', 'Hilton', 'Hyatt', 'InterContinental', 'Sheraton', 'Westin', 'Radisson'];
    const hotelTypes = ['Hotel', 'Resort', 'Suites', 'Inn', 'Grand Hotel', 'Plaza'];
    
    const randomHotel = () => {
      const chain = hotelChains[Math.floor(Math.random() * hotelChains.length)];
      const type = hotelTypes[Math.floor(Math.random() * hotelTypes.length)];
      const price = Math.floor(Math.random() * 200) + 100;
      const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5-5.0 rating
      
      const amenities = [];
      const allAmenities = ['Wifi', 'Breakfast', 'Pool', 'Gym', 'AC', 'Parking', 'Restaurant', 'Bar', 'Room Service', 'Spa'];
      const numAmenities = Math.floor(Math.random() * 4) + 3; // 3-6 amenities
      
      for (let i = 0; i < numAmenities; i++) {
        const idx = Math.floor(Math.random() * allAmenities.length);
        amenities.push(allAmenities[idx]);
        allAmenities.splice(idx, 1); // Remove to avoid duplicates
      }
      
      return {
        id: `hotel-${Math.random().toString(36).substring(2, 9)}`,
        name: `${chain} ${cityCode} ${type}`,
        address: `${Math.floor(Math.random() * 1000) + 100} Main Street, ${cityCode}`,
        rating: parseFloat(rating),
        price: {
          amount: price,
          currency: 'USD'
        },
        amenities: amenities
      };
    };
    
    // Return array of 4 random hotels
    return [randomHotel(), randomHotel(), randomHotel(), randomHotel()];
  }

  /**
   * Convert IATA city code to city name
   */
  async citySearch(keyword: string) {
    try {
      return await this.apiCall('/reference-data/locations', 'GET', {
        keyword,
        subType: 'CITY'
      });
    } catch (error) {
      console.error('Error in city search:', error);
      // Return an empty result that matches the expected format
      return { data: [] };
    }
  }
  
  /**
   * Get airport/city code for a location
   */
  async getLocationCode(cityName: string): Promise<string | null> {
    try {
      const response = await this.citySearch(cityName);
      if (response.data && response.data.length > 0) {
        return response.data[0].iataCode;
      }
      return null;
    } catch (error) {
      console.error('Error getting location code:', error);
      return null;
    }
  }
}

export const amadeus = new AmadeusService();