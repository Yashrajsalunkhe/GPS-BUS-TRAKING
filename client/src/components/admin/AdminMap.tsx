import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BusLocationWithInfo } from '@shared/interfaces';
import busTrackingSocket from '@/lib/websocket';
import { useQuery } from '@tanstack/react-query';
import { fetchAllRoutes } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

// Fix marker icon issue in Leaflet with React
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

const busIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

export default function AdminMap() {
  const [busLocations, setBusLocations] = useState<BusLocationWithInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  
  // Get all routes for filtering
  const { data: routes = [] } = useQuery({
    queryKey: ['/api/routes'],
  });
  
  // Connect to WebSocket and subscribe to bus location updates
  useEffect(() => {
    busTrackingSocket.onConnect(() => {
      setIsConnected(true);
      busTrackingSocket.requestBusLocations();
    });
    
    busTrackingSocket.onDisconnect(() => {
      setIsConnected(false);
    });
    
    // Subscribe to bus location updates
    busTrackingSocket.onBusLocationsUpdate((locations) => {
      // If a route is selected, filter buses
      if (selectedRoute) {
        const filteredBuses = locations.filter(bus => {
          const routeName = bus.routeName || '';
          return routeName.includes(selectedRoute);
        });
        setBusLocations(filteredBuses);
      } else {
        setBusLocations(locations);
      }
    });
    
    // Initial request for bus locations
    if (busTrackingSocket.isConnected()) {
      busTrackingSocket.requestBusLocations();
      setIsConnected(true);
    }
    
    // Cleanup on unmount
    return () => {
      // No need to close the socket as it's shared across the app
    };
  }, [selectedRoute]);
  
  // Handle route selection
  const handleRouteChange = (value: string) => {
    if (value === "all") {
      setSelectedRoute(null);
    } else {
      setSelectedRoute(value);
    }
    busTrackingSocket.requestBusLocations();
  };
  
  // Manual refresh
  const handleRefresh = () => {
    busTrackingSocket.requestBusLocations();
  };
  
  // Calculate map center
  const getMapCenter = () => {
    if (busLocations.length > 0) {
      return [busLocations[0].latitude, busLocations[0].longitude];
    }
    return [20.593, 78.965]; // Default center (India)
  };

  return (
    <Card className="shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Live Bus Tracking</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {isConnected 
                ? busLocations.length > 0 
                  ? 'Current location of all buses' 
                  : 'No buses currently active'
                : 'Connecting to tracking service...'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Select onValueChange={handleRouteChange} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.name}>
                    {route.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="h-[400px] w-full rounded-md overflow-hidden mb-4">
          <MapContainer
            center={getMapCenter() as [number, number]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Bus Markers */}
            {busLocations.map((bus) => (
              <Marker
                key={bus.busId}
                position={[bus.latitude, bus.longitude]}
                icon={busIcon}
              >
                <Popup>
                  <div>
                    <strong>Bus: {bus.busNumber}</strong>
                    <div>Route: {bus.routeName || 'Unknown'}</div>
                    {bus.nextStop && <div>Next Stop: {bus.nextStop}</div>}
                    {bus.eta && <div>ETA: {bus.eta}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {/* Bus Status Cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {busLocations.length > 0 ? (
            busLocations.map((bus) => (
              <div key={bus.busId} className="bg-gray-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">
                  {bus.busNumber} 
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1"></span>
                </div>
                <div className="font-medium">{bus.routeName || 'Unassigned'}</div>
                <div className="text-xs text-gray-500">
                  {bus.nextStop ? `Next: ${bus.nextStop}` : 'No stop info'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-4 text-gray-500">
              No active buses found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
