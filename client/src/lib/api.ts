import { apiRequest } from './queryClient';
import { getAccessToken } from './auth';
import { BusLocationWithInfo, RouteWithStops, AdminDashboardStats, RecentActivity } from '@shared/interfaces';
import { 
  Student, 
  Bus, 
  Driver, 
  Route, 
  Stop,
  Payment,
  Holiday,
  Announcement,
  InsertBus,
  InsertRoute,
  InsertStop,
  InsertDriver,
  InsertSubscription,
  InsertPayment,
  InsertHoliday,
  InsertAnnouncement
} from '@shared/schema';

// Authentication headers helper
const authHeaders = () => ({
  'Authorization': `Bearer ${getAccessToken()}`
});

// Student API
export const fetchStudentProfile = async (): Promise<Student> => {
  const response = await apiRequest('GET', '/api/student/profile', undefined);
  return response.json();
};

export const fetchStudentBusPass = async () => {
  const response = await apiRequest('GET', '/api/student/bus-pass', undefined);
  return response.json();
};

export const fetchStudentPayments = async (): Promise<Payment[]> => {
  const response = await apiRequest('GET', '/api/student/payments', undefined);
  return response.json();
};

export const fetchStudentSubscription = async () => {
  const response = await apiRequest('GET', '/api/student/subscription', undefined);
  return response.json();
};

export const createStudentPayment = async (paymentData: Partial<InsertPayment>) => {
  const response = await apiRequest('POST', '/api/student/payments', paymentData);
  return response.json();
};

export const updateStudentProfile = async (profileData: Partial<Student>) => {
  const response = await apiRequest('PATCH', '/api/student/profile', profileData);
  return response.json();
};

// Route and Stop API
export const fetchAllRoutes = async (): Promise<Route[]> => {
  const response = await apiRequest('GET', '/api/routes', undefined);
  return response.json();
};

export const fetchRouteWithStops = async (routeId: number): Promise<RouteWithStops> => {
  const response = await apiRequest('GET', `/api/routes/${routeId}`, undefined);
  return response.json();
};

export const createRoute = async (routeData: InsertRoute) => {
  const response = await apiRequest('POST', '/api/routes', routeData);
  return response.json();
};

export const updateRoute = async (routeId: number, routeData: Partial<Route>) => {
  const response = await apiRequest('PATCH', `/api/routes/${routeId}`, routeData);
  return response.json();
};

export const deleteRoute = async (routeId: number) => {
  const response = await apiRequest('DELETE', `/api/routes/${routeId}`, undefined);
  return response.json();
};

export const fetchAllStops = async (): Promise<Stop[]> => {
  const response = await apiRequest('GET', '/api/stops', undefined);
  return response.json();
};

export const createStop = async (stopData: InsertStop) => {
  const response = await apiRequest('POST', '/api/stops', stopData);
  return response.json();
};

export const addStopToRoute = async (routeId: number, data: { stopId: number, stopOrder: number, arrivalTime?: string }) => {
  const response = await apiRequest('POST', `/api/routes/${routeId}/stops`, data);
  return response.json();
};

// Bus Management API
export const fetchAllBuses = async (): Promise<Bus[]> => {
  const response = await apiRequest('GET', '/api/buses', undefined);
  return response.json();
};

export const fetchBusesWithRoutes = async () => {
  const response = await apiRequest('GET', '/api/buses/with-routes', undefined);
  return response.json();
};

export const fetchBusById = async (busId: number): Promise<Bus> => {
  const response = await apiRequest('GET', `/api/buses/${busId}`, undefined);
  return response.json();
};

export const createBus = async (busData: InsertBus) => {
  const response = await apiRequest('POST', '/api/buses', busData);
  return response.json();
};

export const updateBus = async (busId: number, busData: Partial<Bus>) => {
  const response = await apiRequest('PATCH', `/api/buses/${busId}`, busData);
  return response.json();
};

export const deleteBus = async (busId: number) => {
  const response = await apiRequest('DELETE', `/api/buses/${busId}`, undefined);
  return response.json();
};

// Driver Management API
export const fetchAllDrivers = async (): Promise<Driver[]> => {
  const response = await apiRequest('GET', '/api/drivers', undefined);
  return response.json();
};

export const createDriver = async (driverData: Partial<InsertDriver> & { username: string, password: string, email: string }) => {
  const response = await apiRequest('POST', '/api/drivers', driverData);
  return response.json();
};

export const updateDriver = async (driverId: number, driverData: Partial<Driver>) => {
  const response = await apiRequest('PATCH', `/api/drivers/${driverId}`, driverData);
  return response.json();
};

export const deleteDriver = async (driverId: number) => {
  const response = await apiRequest('DELETE', `/api/drivers/${driverId}`, undefined);
  return response.json();
};

// Student Management API (Admin)
export const fetchAllStudents = async (filters?: { year?: number, department?: string, routeId?: number }): Promise<Student[]> => {
  let url = '/api/admin/students';
  if (filters) {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.department) params.append('department', filters.department);
    if (filters.routeId) params.append('routeId', filters.routeId.toString());
    if (params.toString()) url += `?${params.toString()}`;
  }
  
  const response = await apiRequest('GET', url, undefined);
  return response.json();
};

export const createStudent = async (studentData: any) => {
  const response = await apiRequest('POST', '/api/admin/students', studentData);
  return response.json();
};

export const updateStudent = async (studentId: number, studentData: Partial<Student>) => {
  const response = await apiRequest('PATCH', `/api/admin/students/${studentId}`, studentData);
  return response.json();
};

export const deleteStudent = async (studentId: number) => {
  const response = await apiRequest('DELETE', `/api/admin/students/${studentId}`, undefined);
  return response.json();
};

export const createSubscription = async (studentId: number, subscriptionData: Partial<InsertSubscription>) => {
  const response = await apiRequest('POST', `/api/admin/students/${studentId}/subscription`, subscriptionData);
  return response.json();
};

export const createPayment = async (studentId: number, paymentData: Partial<InsertPayment>) => {
  const response = await apiRequest('POST', `/api/admin/students/${studentId}/payments`, paymentData);
  return response.json();
};

export const updatePaymentStatus = async (paymentId: number, status: 'pending' | 'completed' | 'failed', transactionId?: string) => {
  const response = await apiRequest('PATCH', `/api/admin/payments/${paymentId}`, { status, transactionId });
  return response.json();
};

// Announcements and Holidays API
export const fetchAllAnnouncements = async (): Promise<Announcement[]> => {
  const response = await apiRequest('GET', '/api/announcements', undefined);
  return response.json();
};

export const createAnnouncement = async (announcementData: Partial<InsertAnnouncement>) => {
  const response = await apiRequest('POST', '/api/announcements', announcementData);
  return response.json();
};

export const deleteAnnouncement = async (announcementId: number) => {
  const response = await apiRequest('DELETE', `/api/announcements/${announcementId}`, undefined);
  return response.json();
};

export const fetchAllHolidays = async (): Promise<Holiday[]> => {
  const response = await apiRequest('GET', '/api/holidays', undefined);
  return response.json();
};

export const createHoliday = async (holidayData: InsertHoliday) => {
  const response = await apiRequest('POST', '/api/holidays', holidayData);
  return response.json();
};

export const deleteHoliday = async (holidayId: number) => {
  const response = await apiRequest('DELETE', `/api/holidays/${holidayId}`, undefined);
  return response.json();
};

// Bus Location API
export const fetchBusLocations = async (): Promise<BusLocationWithInfo[]> => {
  const response = await apiRequest('GET', '/api/bus-locations', undefined);
  return response.json();
};

// Dashboard Stats API
export const fetchAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await apiRequest('GET', '/api/admin/dashboard/stats', undefined);
  return response.json();
};

export const fetchRecentActivities = async (limit: number = 10): Promise<RecentActivity[]> => {
  const response = await apiRequest('GET', `/api/admin/activities?limit=${limit}`, undefined);
  return response.json();
};
