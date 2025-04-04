import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapMarker, Weather } from '@/lib/types';
import { addMarkersToMap, centerMapOnMarkers } from '@/lib/mapUtils';
import InfoCards from './InfoCards';

interface MapContainerProps {
  markers: MapMarker[];
  currentLocation: string;
  weather: Weather | null;
  isCollapsible?: boolean;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  markers, 
  currentLocation,
  weather,
  isCollapsible = false
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'standard' | 'satellite'>('standard');
  
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // If map already exists, don't initialize again
    if (mapRef.current) return;
    
    // Create map with default view (world)
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([20, 0], 2);
    
    // Add better positioning for zoom controls
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
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
  
  // Toggle map tile layer between standard and satellite
  const toggleMapLayer = () => {
    if (!mapRef.current) return;
    
    // Remove existing tile layers
    mapRef.current.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });
    
    // Add new tile layer based on activeLayer state
    if (activeLayer === 'standard') {
      // Add satellite layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }).addTo(mapRef.current);
      setActiveLayer('satellite');
    } else {
      // Add standard layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(mapRef.current);
      setActiveLayer('standard');
    }
  };
  
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
      
      // If we have more than one marker, try to draw a path between them
      if (markers.length > 1) {
        // Sort markers by type (attractions first)
        const sortedMarkers = [...markers].sort((a, b) => {
          if (a.type === 'attraction' && b.type !== 'attraction') return -1;
          if (a.type !== 'attraction' && b.type === 'attraction') return 1;
          return 0;
        });
        
        // Get attraction points for the path
        const pathPoints = sortedMarkers
          .filter(marker => marker.type === 'attraction' || marker.type === 'landmark')
          .map(marker => [marker.latitude, marker.longitude]);
        
        // Draw the path with animation
        if (pathPoints.length > 1) {
          // Create a fancy path with gradient
          const polyline = L.polyline(pathPoints as L.LatLngExpression[], {
            color: 'rgba(99, 102, 241, 0.8)',
            weight: 3,
            opacity: 0.8,
            lineJoin: 'round',
            dashArray: '5, 10',
            dashOffset: '0'
          }).addTo(mapRef.current);
          
          // Animate the path
          let dashOffset = 0;
          const animatePath = () => {
            dashOffset -= 0.5;
            polyline.setStyle({ dashOffset: `${dashOffset}` });
            requestAnimationFrame(animatePath);
          };
          
          animatePath();
        }
      }
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
  
  // Trigger map resize when expanded state changes
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [mapExpanded]);
  
  // Get markers by type for information display
  const foodPlaces = markers.filter(marker => marker.type === 'food').slice(0, 4);
  const hotels = markers.filter(marker => marker.type === 'hotel').slice(0, 2);
  const attractions = markers.filter(marker => marker.type === 'attraction' || marker.type === 'nature').slice(0, 6);
  
  // Count markers by type for stats
  const markerStats = {
    attractions: attractions.length,
    food: foodPlaces.length,
    hotels: hotels.length,
    total: markers.length
  };
  
  // If the map is collapsible, we render it differently
  if (isCollapsible) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    
    return (
      <div className={`transition-all duration-300 ${isCollapsed ? 'w-16 h-16' : 'w-[300px] h-[300px]'}`}>
        {isCollapsed ? (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="w-full h-full flex items-center justify-center bg-primary bg-opacity-90 rounded-lg shadow-lg hover:bg-opacity-100 transition-all"
            title="Expand map"
          >
            <i className="fas fa-map-marked-alt text-white text-xl"></i>
          </button>
        ) : (
          <div className="w-full h-full flex flex-col rounded-lg overflow-hidden glass shadow-xl">
            <div className="p-2 flex justify-between items-center bg-primary bg-opacity-20">
              <div className="text-xs font-medium text-white">
                {currentLocation || "Map"}
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={toggleMapLayer}
                  className="p-1 rounded-md hover:bg-white hover:bg-opacity-20 transition-all"
                  title={activeLayer === 'standard' ? 'Switch to satellite view' : 'Switch to standard view'}
                >
                  <i className={`fas ${activeLayer === 'standard' ? 'fa-satellite' : 'fa-map'} text-white text-xs`}></i>
                </button>
                <button 
                  onClick={() => setIsCollapsed(true)}
                  className="p-1 rounded-md hover:bg-white hover:bg-opacity-20 transition-all"
                  title="Collapse map"
                >
                  <i className="fas fa-times text-white text-xs"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div 
                ref={mapContainerRef} 
                className="h-full w-full"
              ></div>
              
              {markers.length > 0 && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded-md z-10">
                  {markers.length} location{markers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular non-collapsible map (full size)
  return (
    <div className={`glass flex flex-col overflow-hidden transition-all duration-300 ${mapExpanded ? 'h-[600px]' : 'h-[300px]'}`}>
      <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-white flex items-center">
            <i className="fas fa-map-marked-alt text-primary mr-2"></i>
            {currentLocation || "Explore the World"}
          </h2>
          {markers.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing {markers.length} locations • 
              {markerStats.attractions > 0 && <span> {markerStats.attractions} attractions</span>}
              {markerStats.food > 0 && <span> • {markerStats.food} restaurants</span>}
              {markerStats.hotels > 0 && <span> • {markerStats.hotels} hotels</span>}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleMapLayer}
            className="glass-lighter p-2 rounded-lg hover:bg-opacity-30 transition-all"
            title={activeLayer === 'standard' ? 'Switch to satellite view' : 'Switch to standard view'}
          >
            <i className={`fas ${activeLayer === 'standard' ? 'fa-satellite' : 'fa-map'} text-primary`}></i>
          </button>
          <button 
            onClick={() => setMapExpanded(!mapExpanded)}
            className="glass-lighter p-2 rounded-lg hover:bg-opacity-30 transition-all"
            title={mapExpanded ? 'Collapse map' : 'Expand map'}
          >
            <i className={`fas ${mapExpanded ? 'fa-compress-alt' : 'fa-expand-alt'} text-primary`}></i>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Map Container with subtle shadow at the bottom for depth */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 shadow-[inset_0_-10px_20px_-10px_rgba(0,0,0,0.3)] z-20 pointer-events-none"></div>
          <div 
            ref={mapContainerRef} 
            className="h-full w-full"
            id="map-container"
          ></div>
          
          {/* Location type filter overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 z-20">
            <div className="glass-darker py-1 px-3 rounded-full text-xs flex items-center">
              <span className="w-2 h-2 bg-[rgba(132,90,223,0.9)] rounded-full mr-1.5"></span>
              <span>Attractions</span>
            </div>
            <div className="glass-darker py-1 px-3 rounded-full text-xs flex items-center">
              <span className="w-2 h-2 bg-[rgba(255,112,67,0.9)] rounded-full mr-1.5"></span>
              <span>Food</span>
            </div>
            <div className="glass-darker py-1 px-3 rounded-full text-xs flex items-center">
              <span className="w-2 h-2 bg-[rgba(42,157,143,0.9)] rounded-full mr-1.5"></span>
              <span>Hotels</span>
            </div>
          </div>
        </div>
        
        {/* Removed InfoCards from bottom for more map space */}
      </div>
    </div>
  );
};

export default MapContainer;
