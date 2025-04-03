import L from 'leaflet';
import { MapMarker } from './types';

// Create a custom icon for map markers
export function createCustomIcon(type: string): L.DivIcon {
  let iconClass = 'custom-marker';
  let iconContent = '';

  switch (type) {
    case 'food':
      iconContent = '<i class="fas fa-utensils"></i>';
      break;
    case 'attraction':
      iconContent = '<i class="fas fa-monument"></i>';
      break;
    case 'hotel':
      iconContent = '<i class="fas fa-bed"></i>';
      break;
    case 'nature':
      iconContent = '<i class="fas fa-leaf"></i>';
      break;
    case 'landmark':
      iconContent = '<i class="fas fa-landmark"></i>';
      break;
    default:
      iconContent = '<i class="fas fa-map-marker-alt"></i>';
  }

  return L.divIcon({
    className: iconClass,
    html: iconContent,
    iconSize: [30, 30]
  });
}

// Create popup content for map markers
export function createPopupContent(marker: MapMarker): string {
  return `
    <div class="text-center p-2" style="min-width: 120px;">
      <div class="font-medium">${marker.name}</div>
      <div class="text-xs text-arctic-blue">${marker.type}</div>
    </div>
  `;
}

// Add markers to a Leaflet map
export function addMarkersToMap(map: L.Map, markers: MapMarker[]): L.Marker[] {
  return markers.map(marker => {
    const icon = createCustomIcon(marker.type);
    const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon }).addTo(map);
    
    leafletMarker.bindPopup(createPopupContent(marker));
    
    return leafletMarker;
  });
}

// Center map on markers
export function centerMapOnMarkers(map: L.Map, markers: MapMarker[]): void {
  if (markers.length === 0) return;
  
  if (markers.length === 1) {
    map.setView([markers[0].latitude, markers[0].longitude], 13);
    return;
  }
  
  const latitudes = markers.map(m => m.latitude);
  const longitudes = markers.map(m => m.longitude);
  
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  
  map.fitBounds([
    [minLat, minLng],
    [maxLat, maxLng]
  ], { padding: [50, 50] });
}
