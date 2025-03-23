import { getAccessToken } from './auth';
import { BusLocationWithInfo } from '@shared/interfaces';

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

// Properly detect WebSocket URL based on current protocol
const getWebsocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
};

class BusTrackingSocket {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private onConnectHandlers: ConnectionHandler[] = [];
  private onDisconnectHandlers: ConnectionHandler[] = [];
  
  constructor() {
    this.messageHandlers.set('bus_locations', []);
    this.messageHandlers.set('auth_result', []);
  }
  
  connect(): void {
    if (this.socket) {
      this.close();
    }
    
    try {
      this.socket = new WebSocket(getWebsocketUrl());
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Send authentication if token exists
        const token = getAccessToken();
        if (token) {
          this.authenticate(token);
        }
        
        // Request initial bus locations
        this.requestBusLocations();
        
        // Notify connection handlers
        this.onConnectHandlers.forEach(handler => handler());
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type && this.messageHandlers.has(message.type)) {
            const handlers = this.messageHandlers.get(message.type);
            handlers?.forEach(handler => handler(message.data));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.connected = false;
        
        // Notify disconnection handlers
        this.onDisconnectHandlers.forEach(handler => handler());
        
        // Attempt to reconnect
        this.scheduleReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }
  
  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  isConnected(): boolean {
    return this.connected && this.socket?.readyState === WebSocket.OPEN;
  }
  
  onConnect(handler: ConnectionHandler): void {
    this.onConnectHandlers.push(handler);
    
    // Call handler immediately if already connected
    if (this.isConnected()) {
      handler();
    }
  }
  
  onDisconnect(handler: ConnectionHandler): void {
    this.onDisconnectHandlers.push(handler);
  }
  
  onBusLocationsUpdate(handler: (locations: BusLocationWithInfo[]) => void): void {
    const handlers = this.messageHandlers.get('bus_locations') || [];
    handlers.push(handler);
    this.messageHandlers.set('bus_locations', handlers);
  }
  
  authenticate(token: string): void {
    if (!this.isConnected()) {
      return;
    }
    
    this.socket?.send(JSON.stringify({
      type: 'auth',
      token
    }));
  }
  
  requestBusLocations(): void {
    if (!this.isConnected()) {
      return;
    }
    
    this.socket?.send(JSON.stringify({
      type: 'request_bus_locations'
    }));
  }
  
  updateBusLocation(busId: number, latitude: number, longitude: number, speed: number): void {
    if (!this.isConnected()) {
      return;
    }
    
    const token = getAccessToken();
    if (!token) {
      console.error('Authentication required to update bus location');
      return;
    }
    
    this.socket?.send(JSON.stringify({
      type: 'update_bus_location',
      token,
      busId,
      latitude,
      longitude,
      speed
    }));
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Exponential backoff for reconnection attempts
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }
}

// Create a singleton instance
export const busTrackingSocket = new BusTrackingSocket();

// Auto-connect when the module is imported
busTrackingSocket.connect();

export default busTrackingSocket;
