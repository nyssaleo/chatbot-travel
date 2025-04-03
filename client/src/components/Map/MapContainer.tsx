import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapMarker, Weather } from '@/lib/types';
import { addMarkersToMap, centerMapOnMarkers } from '@/lib/mapUtils';
import InfoCards from './InfoCards';

interface MapContainerProps {
  markers: MapMarker[];
  currentLocation: string;
  weather: Weather | null;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  markers, 
  currentLocation,
  weather
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // If map already exists, don't initialize again
    if (mapRef.current) return;
    
    // Create map with default view (world)
    const map = L.map(mapContainerRef.current).setView([20, 0], 2);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
    
    // Save map reference
    mapRef.current = map;
    
    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add new markers
    if (markers.length > 0) {
      markersRef.current = addMarkersToMap(mapRef.current, markers);
      centerMapOnMarkers(mapRef.current, markers);
    }
  }, [markers]);
  
  // Handle window resize to update map
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Get popular food places from markers
  const foodPlaces = markers.filter(marker => 
    marker.type === 'food'
  ).slice(0, 4);
  
  return (
    <div className="glass lg:w-1/2 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[rgba(255,255,255,0.2)] flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">
          {currentLocation || "Explore the World"}
        </h2>
        <div className="flex space-x-2">
          <button className="glass-lighter p-2 rounded-lg hover:bg-opacity-30 transition-all">
            <i className="fas fa-search text-[#88CCEE]"></i>
          </button>
          <button className="glass-lighter p-2 rounded-lg hover:bg-opacity-30 transition-all">
            <i className="fas fa-layer-group text-[#88CCEE]"></i>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Map Container */}
        <div 
          ref={mapContainerRef} 
          className="flex-1 relative"
          id="map-container"
        ></div>
        
        {/* Information Cards */}
        <InfoCards 
          weather={weather}
          foodPlaces={foodPlaces}
        />
      </div>
    </div>
  );
};

export default MapContainer;
