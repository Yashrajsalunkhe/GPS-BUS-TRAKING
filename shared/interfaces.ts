import { User, Student, Bus, Driver, Route, Stop, Subscription, Payment } from './schema';

// Extended interfaces that combine data from multiple tables
export interface StudentWithUser extends Student {
  user: User;
}

export interface DriverWithUser extends Driver {
  user: User;
}

export interface BusWithRoute extends Bus {
  route?: Route;
  driver?: Driver;
}

export interface RouteWithStops extends Route {
  stops: (Stop & { arrivalTime: string; stopOrder: number })[];
}

export interface StudentWithSubscription extends Student {
  subscription?: Subscription & { payments: Payment[] };
}

// Interface for bus location with additional info
export interface BusLocationWithInfo {
  busId: number;
  busNumber: string;
  latitude: number;
  longitude: number;
  routeName?: string;
  nextStop?: string;
  eta?: string;
}

// Interface for dashboard stats
export interface AdminDashboardStats {
  totalStudents: number;
  totalBuses: number;
  totalRoutes: number;
  pendingFees: number;
}

// Interface for recent activities
export interface RecentActivity {
  id: number;
  action: string;
  user: {
    id: number;
    name: string;
    identifier: string; // URN or email
  };
  details: string;
  timestamp: string;
}

// Interface for auth token response
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}
