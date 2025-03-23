import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/StudentLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MapPin, Clock } from "lucide-react";
import { fetchAllRoutes, fetchRouteWithStops } from "@/lib/api";
import { Route } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const stopIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/484/484167.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

export default function RoutesPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  
  // Fetch all routes
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['/api/routes'],
    queryFn: fetchAllRoutes
  });
  
  // Fetch selected route with stops
  const { data: routeWithStops, isLoading: isLoadingRouteDetails } = useQuery({
    queryKey: ['/api/routes', selectedRouteId],
    queryFn: () => fetchRouteWithStops(selectedRouteId || 0),
    enabled: !!selectedRouteId
  });
  
  // Handle route selection
  const handleRouteSelect = (routeId: number) => {
    setSelectedRouteId(routeId);
  };
  
  // Format time from HH:MM:SS to 12-hour format
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hoursNum = parseInt(hours);
      const ampm = hoursNum >= 12 ? 'PM' : 'AM';
      const hours12 = hoursNum % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };
  
  // Calculate evening time (add 8 hours to morning time)
  const formatEveningTime = (timeString: string) => {
    try {
      const [hours, minutes, seconds] = timeString.split(':');
      let hoursNum = parseInt(hours) + 8;
      if (hoursNum >= 24) hoursNum -= 24;
      const ampm = hoursNum >= 12 ? 'PM' : 'AM';
      const hours12 = hoursNum % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };
  
  // Get map center based on stops
  const getMapCenter = () => {
    if (routeWithStops?.stops && routeWithStops.stops.length > 0) {
      return [routeWithStops.stops[0].latitude, routeWithStops.stops[0].longitude];
    }
    return [20.593, 78.965]; // Default center (India)
  };
  
  // Create route path from stops
  const getRoutePath = () => {
    if (routeWithStops?.stops && routeWithStops.stops.length > 0) {
      return routeWithStops.stops
        .sort((a, b) => a.stopOrder - b.stopOrder)
        .map(stop => [stop.latitude, stop.longitude]);
    }
    return [];
  };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Bus Routes & Stops</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View all available bus routes and their stops
          </p>
        </div>
        
        <div className="space-y-6">
          <Tabs defaultValue="routes">
            <TabsList className="mb-4">
              <TabsTrigger value="routes">Routes & Stops</TabsTrigger>
              <TabsTrigger value="map">Route Map</TabsTrigger>
            </TabsList>
            
            <TabsContent value="routes">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Routes List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Available Routes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRoutes ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : routes.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No routes available
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {routes.map((route: Route) => (
                          <div
                            key={route.id}
                            className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedRouteId === route.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                            }`}
                            onClick={() => handleRouteSelect(route.id)}
                          >
                            <h3 className="font-medium">{route.name}</h3>
                            <p className="text-sm text-gray-500 mt-1 truncate">
                              {route.description || 'No description'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Route Stops */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>
                      {selectedRouteId 
                        ? `Stops: ${routes.find(r => r.id === selectedRouteId)?.name}` 
                        : 'Select a route to view stops'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedRouteId ? (
                      <div className="text-center py-12 text-gray-500">
                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Select a route from the list to view its stops</p>
                      </div>
                    ) : isLoadingRouteDetails ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : routeWithStops?.stops && routeWithStops.stops.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Stop Name</TableHead>
                            <TableHead>Morning Arrival</TableHead>
                            <TableHead>Evening Departure</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {routeWithStops.stops
                            .sort((a, b) => a.stopOrder - b.stopOrder)
                            .map((stop) => (
                              <TableRow key={stop.id}>
                                <TableCell>{stop.stopOrder}</TableCell>
                                <TableCell className="font-medium">{stop.name}</TableCell>
                                <TableCell>
                                  {stop.arrivalTime ? (
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                      {formatTime(stop.arrivalTime)}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Not set</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {stop.arrivalTime ? (
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                      {formatEveningTime(stop.arrivalTime)}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Not set</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No stops found for this route
                      </div>
                    )}
                    
                    {selectedRouteId && routeWithStops && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-md">
                        <div className="text-sm text-gray-500">
                          <p className="mb-1">* Morning times are for pickup to college</p>
                          <p>* Evening times are for return journey from college</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="map">
              <Card>
                <CardHeader>
                  <CardTitle>Route Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <label htmlFor="route-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Route
                    </label>
                    <select
                      id="route-select"
                      className="w-full md:w-64 rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      value={selectedRouteId || ""}
                      onChange={(e) => setSelectedRouteId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">Select a route</option>
                      {routes.map((route: Route) => (
                        <option key={route.id} value={route.id}>{route.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedRouteId ? (
                    <div className="h-[500px] rounded-md overflow-hidden">
                      <MapContainer
                        center={getMapCenter() as [number, number]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {/* Stop Markers */}
                        {routeWithStops?.stops && routeWithStops.stops.map((stop) => (
                          <Marker
                            key={stop.id}
                            position={[stop.latitude, stop.longitude]}
                            icon={stopIcon}
                          >
                            <Popup>
                              <div>
                                <strong>{stop.name}</strong>
                                {stop.arrivalTime && (
                                  <div>Morning arrival: {formatTime(stop.arrivalTime)}</div>
                                )}
                                {stop.arrivalTime && (
                                  <div>Evening departure: {formatEveningTime(stop.arrivalTime)}</div>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                        
                        {/* Route Path */}
                        {getRoutePath().length > 1 && (
                          <Polyline
                            positions={getRoutePath() as [number, number][]}
                            color="#1E40AF"
                            weight={4}
                            opacity={0.7}
                            dashArray="10, 10"
                          />
                        )}
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-md">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Select a route to view on the map</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Map Legend</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <div className="h-5 w-5 mr-2">
                          <img src="https://cdn-icons-png.flaticon.com/512/484/484167.png" alt="Stop icon" className="h-full w-full" />
                        </div>
                        <span className="text-sm text-gray-600">Bus stop</span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-10 h-1 bg-blue-600 mr-2"></div>
                        <span className="text-sm text-gray-600">Bus route</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </StudentLayout>
  );
}
