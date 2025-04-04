# TravelerAI - Travel Planning Assistant

TravelerAI is an AI-powered travel planning application that helps users create personalized itineraries, explore destinations, and access comprehensive travel information through an intuitive interface.

## Features

- **Conversational AI Assistant**: Chat with an AI assistant to plan your trips and get personalized recommendations
- **Interactive Maps**: Explore destinations with integrated OpenStreetMap
- **Detailed Itineraries**: Receive day-by-day travel plans with activities and points of interest
- **Travel Information**: Access flights, hotels, local food, and activities recommendations
- **Weather Updates**: View weather forecasts for your destinations
- **Export Functionality**: Save your itineraries as PDFs

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Node.js, Express
- **AI Integration**: Groq API for natural language processing
- **Maps**: Leaflet.js with OpenStreetMap
- **Database**: PostgreSQL with Drizzle ORM
- **APIs**: Amadeus for flight/hotel data, WeatherAPI for forecasts

## Screenshots

![image](https://github.com/user-attachments/assets/33e3acfb-3027-41f7-9358-3a2cba8b367d)
![image](https://github.com/user-attachments/assets/52628407-4632-43b5-9565-84e1847e9a80)



## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/traveler-ai.git
cd traveler-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```
DATABASE_URL=your_database_connection_string
GROQ_API_KEY=your_groq_api_key
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_secret
WEATHER_API_KEY=your_weather_api_key
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Start a conversation with the AI assistant
3. Specify your destination, travel dates, and preferences
4. Explore the generated itinerary and recommendations
5. Export your trip plan when ready
