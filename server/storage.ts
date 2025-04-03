import { users, type User, type InsertUser, messages, type Message, type InsertMessage, locations, type Location, type InsertLocation, itineraries, type Itinerary, type InsertItinerary } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Location methods
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Itinerary methods
  getItinerary(id: number): Promise<Itinerary | undefined>;
  getItinerariesByUserId(userId: number): Promise<Itinerary[]>;
  createItinerary(itinerary: InsertItinerary): Promise<Itinerary>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private locations: Map<number, Location>;
  private itineraries: Map<number, Itinerary>;
  currentId: {
    user: number;
    message: number;
    location: number;
    itinerary: number;
  };

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.locations = new Map();
    this.itineraries = new Map();
    this.currentId = {
      user: 1,
      message: 1,
      location: 1,
      itinerary: 1
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.user++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.userId === userId
    );
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentId.message++;
    const timestamp = new Date();
    const message: Message = { ...insertMessage, id, timestamp };
    this.messages.set(id, message);
    return message;
  }
  
  // Location methods
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }
  
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.currentId.location++;
    const location: Location = { ...insertLocation, id };
    this.locations.set(id, location);
    return location;
  }
  
  // Itinerary methods
  async getItinerary(id: number): Promise<Itinerary | undefined> {
    return this.itineraries.get(id);
  }
  
  async getItinerariesByUserId(userId: number): Promise<Itinerary[]> {
    return Array.from(this.itineraries.values()).filter(
      (itinerary) => itinerary.userId === userId
    );
  }
  
  async createItinerary(insertItinerary: InsertItinerary): Promise<Itinerary> {
    const id = this.currentId.itinerary++;
    const created = new Date();
    const itinerary: Itinerary = { ...insertItinerary, id, created };
    this.itineraries.set(id, itinerary);
    return itinerary;
  }
}

export const storage = new MemStorage();
