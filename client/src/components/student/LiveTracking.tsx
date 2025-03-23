import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { BusLocationWithInfo } from '@shared/interfaces';
import { busTrackingSocket } from '@/lib/websocket';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentProfile, fetchRouteWithStops } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

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

const stopIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/484/484167.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

export default function LiveTracking() {
  const [busLocations, setBusLocations] = useState<BusLocationWithInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusLocationWithInfo | null>(null);
  
  // Get student profile to know which route they're on
  const { data: studentProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/student/profile'],
  });
  
  // Get route stops once we have the student profile
  const { data: routeWithStops, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['/api/routes', studentProfile?.routeId],
    queryFn: () => fetchRouteWithStops(studentProfile?.routeId || 0),
    enabled: !!studentProfile?.routeId,
  });
  
  const isLoading = isLoadingProfile || isLoadingRoute;
  
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
      if (studentProfile && studentProfile.routeId) {
        // Filter bus locations to only show buses on the student's route
        const relevantBuses = locations.filter(bus => {
          const routeName = bus.routeName || '';
          return routeName.includes(routeWithStops?.name || '');
        });
        
        setBusLocations(relevantBuses);
        
        // If we have a bus and no selectedBus yet, select the first one
        if (relevantBuses.length > 0 && !selectedBus) {
          setSelectedBus(relevantBuses[0]);
        }
      } else {
        setBusLocations(locations);
        
        // If no route filter, just select the first bus
        if (locations.length > 0 && !selectedBus) {
          setSelectedBus(locations[0]);
        }
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
  }, [studentProfile, routeWithStops, selectedBus]);
  
  // Create route path from stops
  const routePath = routeWithStops?.stops?.map(stop => [stop.latitude, stop.longitude]) || [];
  
  // Calculate map center based on bus location or route
  const getMapCenter = () => {
    if (selectedBus) {
      return [selectedBus.latitude, selectedBus.longitude];
    } else if (routePath.length > 0) {
      return routePath[0];
    }
    return [20.593, 78.965]; // Default center (India)
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-6 w-64 mb-4" />
          <Skeleton className="w-full h-[400px] rounded-md mb-4" />
          <Skeleton className="h-16 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Live Bus Tracking</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 mb-4">
          {isConnected 
            ? busLocations.length > 0 
              ? 'Your bus is currently on the route.' 
              : 'No buses are currently active on your route.'
            : 'Connecting to tracking service...'}
        </p>
        
        <div className="h-[400px] w-full rounded-md overflow-hidden mb-4">
          <MapContainer
            center={getMapCenter() as [number, number]}
            zoom={14}
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
            
            {/* Stop Markers */}
            {routeWithStops?.stops?.map((stop) => (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={stopIcon}
              >
                <Popup>
                  <div>
                    <strong>{stop.name}</strong>
                    {stop.arrivalTime && <div>Expected Arrival: {stop.arrivalTime}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Route Path */}
            {routePath.length > 1 && (
              <Polyline
                positions={routePath as [number, number][]}
                color="#1E40AF"
                weight={4}
                opacity={0.7}
                dashArray="10, 10"
              />
            )}
          </MapContainer>
        </div>
        
        {/* ETA Info */}
        {selectedBus && (
          <div className="mt-4 bg-gray-50 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Next Stop</p>
                <p className="font-medium">{selectedBus.nextStop || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Arrival</p>
                <p className="font-medium">{selectedBus.eta || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bus Number</p>
                <p className="font-medium">{selectedBus.busNumber}</p>
              </div>
            </div>
          </div>
        )}
        
        {!selectedBus && busLocations.length === 0 && (
          <div className="mt-4 bg-gray-50 rounded-md p-4 text-center">
            <p className="text-gray-500">No buses are currently active on your route.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
