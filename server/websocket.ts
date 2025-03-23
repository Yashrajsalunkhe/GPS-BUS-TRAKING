import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { BusLocationWithInfo } from '@shared/interfaces';
import jwt from 'jsonwebtoken';

// Secret key for JWT
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret_key';

// Store connected clients
const clients = new Map<string, WebSocket>();

// Setup WebSocket server
export const setupWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Generate a unique client ID
    const clientId = Math.random().toString(36).substring(2, 15);
    clients.set(clientId, ws);
    
    // Send initial bus locations
    sendBusLocations(ws);
    
    // Handle messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'auth':
            handleAuthentication(ws, data.token, clientId);
            break;
            
          case 'update_bus_location':
            if (data.token) {
              const isAuthorized = verifyToken(data.token, ['admin', 'driver']);
              if (isAuthorized) {
                await updateBusLocation(data.busId, data.latitude, data.longitude, data.speed);
                broadcastBusLocations();
              }
            }
            break;
            
          case 'request_bus_locations':
            sendBusLocations(ws);
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(clientId);
    });
  });
  
  // Start periodic broadcasting of bus locations
  setInterval(() => {
    simulateBusMovements();
    broadcastBusLocations();
  }, 10000); // Every 10 seconds
  
  console.log('WebSocket server initialized');
  return wss;
};

// Verify JWT token and check role
const verifyToken = (token: string, allowedRoles: string[]): boolean => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as jwt.JwtPayload;
    return decoded && allowedRoles.includes(decoded.role);
  } catch (error) {
    return false;
  }
};

// Handle client authentication
const handleAuthentication = (ws: WebSocket, token: string, clientId: string) => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as jwt.JwtPayload;
    console.log(`Client ${clientId} authenticated as ${decoded.username} with role ${decoded.role}`);
    
    // Send authentication success message
    ws.send(JSON.stringify({
      type: 'auth_result',
      success: true,
      username: decoded.username,
      role: decoded.role
    }));
    
  } catch (error) {
    console.log(`Client ${clientId} authentication failed`);
    
    // Send authentication failure message
    ws.send(JSON.stringify({
      type: 'auth_result',
      success: false,
      message: 'Invalid authentication token'
    }));
  }
};

// Update bus location in storage
const updateBusLocation = async (busId: number, latitude: number, longitude: number, speed: number) => {
  try {
    await storage.updateBusLocation({
      busId,
      latitude,
      longitude,
      speed
    });
  } catch (error) {
    console.error('Error updating bus location:', error);
  }
};

// Send bus locations to a specific client
const sendBusLocations = async (ws: WebSocket) => {
  try {
    const busLocations = await storage.getBusLocationsWithInfo();
    
    ws.send(JSON.stringify({
      type: 'bus_locations',
      data: busLocations
    }));
  } catch (error) {
    console.error('Error sending bus locations:', error);
  }
};

// Simulate bus movements with small random changes
const simulateBusMovements = async () => {
  try {
    // Get all buses
    const buses = await storage.getAllBuses();
    
    // Update each bus location with a small movement
    for (const bus of buses) {
      // Get current location
      const currentLocation = await storage.getBusLocation(bus.id);
      
      if (currentLocation) {
        // Generate small random movement (approx. 0.0001-0.0005 degrees, roughly 10-50 meters)
        const latChange = (Math.random() - 0.5) * 0.0005;
        const lngChange = (Math.random() - 0.5) * 0.0005;
        
        // Update the location
        await storage.updateBusLocation({
          busId: bus.id,
          latitude: currentLocation.latitude + latChange,
          longitude: currentLocation.longitude + lngChange,
          speed: Math.floor(Math.random() * 10) + 15 // Random speed between 15-25 km/h
        });
      }
    }
    
    console.log('Bus movements simulated');
  } catch (error) {
    console.error('Error simulating bus movements:', error);
  }
};

// Broadcast bus locations to all connected clients
const broadcastBusLocations = async () => {
  try {
    const busLocations = await storage.getBusLocationsWithInfo();
    
    const message = JSON.stringify({
      type: 'bus_locations',
      data: busLocations
    });
    
    for (const client of clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  } catch (error) {
    console.error('Error broadcasting bus locations:', error);
  }
};
