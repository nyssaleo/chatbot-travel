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
   * Search for flights between origins and destinations
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
    
    return this.apiCall('/shopping/flight-offers', 'GET', params);
  }

  /**
   * Search for hotels in a city
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
    
    return this.apiCall('/shopping/hotel-offers', 'GET', params);
  }

  /**
   * Convert IATA city code to city name
   */
  async citySearch(keyword: string) {
    return this.apiCall('/reference-data/locations', 'GET', {
      keyword,
      subType: 'CITY'
    });
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