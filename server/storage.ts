import {
  users,
  students,
  routes,
  stops,
  routeStops,
  buses,
  drivers,
  busLocations,
  subscriptions,
  payments,
  announcements,
  activityLogs,
  holidays,
  type User,
  type Student,
  type Route,
  type Stop,
  type RouteStop,
  type Bus,
  type Driver,
  type BusLocation,
  type Subscription,
  type Payment,
  type Announcement,
  type ActivityLog,
  type Holiday,
  type InsertUser,
  type InsertStudent,
  type InsertRoute,
  type InsertStop,
  type InsertRouteStop,
  type InsertBus,
  type InsertDriver,
  type InsertBusLocation,
  type InsertSubscription,
  type InsertPayment,
  type InsertAnnouncement,
  type InsertHoliday,
} from "@shared/schema";
import { StudentWithUser, BusWithRoute, RouteWithStops, BusLocationWithInfo, AdminDashboardStats, RecentActivity } from "@shared/interfaces";

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRefreshToken(userId: number, refreshToken: string | null): Promise<User>;

  // Student Management
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  getStudentByUrn(urn: string): Promise<Student | undefined>;
  getStudentWithUser(id: number): Promise<StudentWithUser | undefined>;
  getAllStudents(): Promise<Student[]>;
  getAllStudentsWithFilters(filters: { year?: number; department?: string; routeId?: number }): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, data: Partial<Student>): Promise<Student>;
  deleteStudent(id: number): Promise<boolean>;

  // Route Management
  getRoute(id: number): Promise<Route | undefined>;
  getAllRoutes(): Promise<Route[]>;
  getRouteWithStops(id: number): Promise<RouteWithStops | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, data: Partial<Route>): Promise<Route>;
  deleteRoute(id: number): Promise<boolean>;

  // Stop Management
  getStop(id: number): Promise<Stop | undefined>;
  getAllStops(): Promise<Stop[]>;
  createStop(stop: InsertStop): Promise<Stop>;
  updateStop(id: number, data: Partial<Stop>): Promise<Stop>;
  deleteStop(id: number): Promise<boolean>;

  // Route Stops Management
  getRouteStop(id: number): Promise<RouteStop | undefined>;
  getRouteStopsByRoute(routeId: number): Promise<RouteStop[]>;
  createRouteStop(routeStop: InsertRouteStop): Promise<RouteStop>;
  updateRouteStop(id: number, data: Partial<RouteStop>): Promise<RouteStop>;
  deleteRouteStop(id: number): Promise<boolean>;

  // Bus Management
  getBus(id: number): Promise<Bus | undefined>;
  getBusByNumber(busNumber: string): Promise<Bus | undefined>;
  getAllBuses(): Promise<Bus[]>;
  getBusesWithRoute(): Promise<BusWithRoute[]>;
  createBus(bus: InsertBus): Promise<Bus>;
  updateBus(id: number, data: Partial<Bus>): Promise<Bus>;
  deleteBus(id: number): Promise<boolean>;

  // Driver Management
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByUserId(userId: number): Promise<Driver | undefined>;
  getAllDrivers(): Promise<Driver[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, data: Partial<Driver>): Promise<Driver>;
  deleteDriver(id: number): Promise<boolean>;

  // Bus Location Management
  getBusLocation(busId: number): Promise<BusLocation | undefined>;
  getAllBusLocations(): Promise<BusLocation[]>;
  getBusLocationsWithInfo(): Promise<BusLocationWithInfo[]>;
  updateBusLocation(busLocation: InsertBusLocation): Promise<BusLocation>;

  // Subscription Management
  getSubscription(id: number): Promise<Subscription | undefined>;
  getActiveSubscriptionByStudent(studentId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription>;

  // Payment Management
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByStudent(studentId: number): Promise<Payment[]>;
  getPaymentsBySubscription(subscriptionId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, data: Partial<Payment>): Promise<Payment>;

  // Announcement Management
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getAllAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<boolean>;

  // Activity Log Management
  createActivityLog(log: { userId?: number; action: string; details?: string; ipAddress?: string }): Promise<ActivityLog>;
  getRecentActivities(limit: number): Promise<RecentActivity[]>;

  // Holiday Management
  getHoliday(id: number): Promise<Holiday | undefined>;
  getAllHolidays(): Promise<Holiday[]>;
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  deleteHoliday(id: number): Promise<boolean>;

  // Dashboard Stats
  getAdminDashboardStats(): Promise<AdminDashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private routes: Map<number, Route>;
  private stops: Map<number, Stop>;
  private routeStops: Map<number, RouteStop>;
  private buses: Map<number, Bus>;
  private drivers: Map<number, Driver>;
  private busLocations: Map<number, BusLocation>;
  private subscriptions: Map<number, Subscription>;
  private payments: Map<number, Payment>;
  private announcements: Map<number, Announcement>;
  private activityLogs: Map<number, ActivityLog>;
  private holidays: Map<number, Holiday>;
  
  private currentUserId: number = 1;
  private currentStudentId: number = 1;
  private currentRouteId: number = 1;
  private currentStopId: number = 1;
  private currentRouteStopId: number = 1;
  private currentBusId: number = 1;
  private currentDriverId: number = 1;
  private currentBusLocationId: number = 1;
  private currentSubscriptionId: number = 1;
  private currentPaymentId: number = 1;
  private currentAnnouncementId: number = 1;
  private currentActivityLogId: number = 1;
  private currentHolidayId: number = 1;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.routes = new Map();
    this.stops = new Map();
    this.routeStops = new Map();
    this.buses = new Map();
    this.drivers = new Map();
    this.busLocations = new Map();
    this.subscriptions = new Map();
    this.payments = new Map();
    this.announcements = new Map();
    this.activityLogs = new Map();
    this.holidays = new Map();
    
    // Initialize with sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Create sample routes
    const route1 = this.createRoute({ name: "Route 1 - City Center", description: "Main route through city center", active: true });
    const route2 = this.createRoute({ name: "Route 2 - North Campus", description: "Route to north campus area", active: true });
    const route3 = this.createRoute({ name: "Route 3 - South Hills", description: "Southern route through hills", active: true });
    
    // Create sample stops
    const stop1 = this.createStop({ name: "College Main Gate", latitude: 20.590, longitude: 78.960 });
    const stop2 = this.createStop({ name: "Central Library", latitude: 20.595, longitude: 78.963 });
    const stop3 = this.createStop({ name: "North Campus", latitude: 20.598, longitude: 78.968 });
    const stop4 = this.createStop({ name: "East Station", latitude: 20.592, longitude: 78.972 });
    
    // Add stops to routes
    this.createRouteStop({ routeId: route1.id, stopId: stop1.id, stopOrder: 1, arrivalTime: "08:00:00" });
    this.createRouteStop({ routeId: route1.id, stopId: stop2.id, stopOrder: 2, arrivalTime: "08:15:00" });
    this.createRouteStop({ routeId: route2.id, stopId: stop1.id, stopOrder: 1, arrivalTime: "09:00:00" });
    this.createRouteStop({ routeId: route2.id, stopId: stop3.id, stopOrder: 2, arrivalTime: "09:20:00" });
    this.createRouteStop({ routeId: route3.id, stopId: stop1.id, stopOrder: 1, arrivalTime: "10:00:00" });
    this.createRouteStop({ routeId: route3.id, stopId: stop4.id, stopOrder: 2, arrivalTime: "10:25:00" });
    
    // Create sample buses
    const bus1 = this.createBus({ busNumber: "BUS-101", capacity: 50, model: "Volvo 9400", routeId: route1.id, active: true });
    const bus2 = this.createBus({ busNumber: "BUS-102", capacity: 45, model: "Ashok Leyland", routeId: route2.id, active: true });
    const bus3 = this.createBus({ busNumber: "BUS-103", capacity: 50, model: "Tata Starbus", routeId: route3.id, active: true });
    
    // Set initial bus locations
    this.updateBusLocation({ busId: bus1.id, latitude: 20.593, longitude: 78.965, speed: 20 });
    this.updateBusLocation({ busId: bus2.id, latitude: 20.598, longitude: 78.958, speed: 15 });
    this.updateBusLocation({ busId: bus3.id, latitude: 20.588, longitude: 78.972, speed: 18 });
    
    // Create admin user
    const adminUser = this.createUser({
      username: "admin",
      password: "$2b$10$H0h/XVuJxJMC7l2/K80Ef.4OMx0NHOEtP3yrGDYD8PsDQUbZ6Ffeq", // "password123" - plaintext version for easier login
      email: "admin@college.edu",
      role: "admin"
    });
    
    // Create driver users
    const driverUser1 = this.createUser({
      username: "driver1",
      password: "$2b$10$Y5H0nSQyvdoX.pKl7wCmHOMBWK5eSX1yFjm00s1q05uVPGGOkGJKe", // "password"
      email: "driver1@college.edu",
      role: "driver"
    });
    
    const driverUser2 = this.createUser({
      username: "driver2",
      password: "$2b$10$Y5H0nSQyvdoX.pKl7wCmHOMBWK5eSX1yFjm00s1q05uVPGGOkGJKe", // "password"
      email: "driver2@college.edu",
      role: "driver"
    });
    
    // Create drivers
    const driver1 = this.createDriver({
      userId: driverUser1.id,
      name: "Rakesh Kumar",
      mobile: "9876543210",
      licenseNumber: "DL1234567",
      address: "123 Driver Colony, City",
      busId: bus1.id
    });
    
    const driver2 = this.createDriver({
      userId: driverUser2.id,
      name: "Suresh Singh",
      mobile: "9876543211",
      licenseNumber: "DL7654321",
      address: "456 Driver Colony, City",
      busId: bus2.id
    });
    
    // Create student user
    const studentUser = this.createUser({
      username: "student1",
      password: "$2b$10$Y5H0nSQyvdoX.pKl7wCmHOMBWK5eSX1yFjm00s1q05uVPGGOkGJKe", // "password"
      email: "john.doe@college.edu",
      role: "student"
    });
    
    // Create student
    const student = this.createStudent({
      userId: studentUser.id,
      urn: "CS21344",
      name: "John Doe",
      email: "john.doe@college.edu",
      mobile: "9876543212",
      address: "789 Student Hostel, College Campus",
      year: 3,
      department: "Computer Science",
      routeId: route2.id,
      profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&h=500&q=80"
    });
    
    // Create subscription for student
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    const subscription = this.createSubscription({
      studentId: student.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      amount: 5000,
      active: true
    });
    
    // Create payment record
    this.createPayment({
      studentId: student.id,
      amount: 5000,
      paymentDate: new Date().toISOString(),
      paymentMethod: "online",
      transactionId: "TXN123456",
      status: "completed",
      subscriptionId: subscription.id
    });
    
    // Create announcements
    this.createAnnouncement({
      title: "Bus Schedule Change",
      content: "Morning pickup time changed to 7:45 AM starting Monday.",
      createdBy: adminUser.id
    });
    
    this.createAnnouncement({
      title: "Holiday Notice",
      content: "No bus service on May 1st due to Labor Day.",
      createdBy: adminUser.id
    });
    
    // Add holidays
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    this.createHoliday({
      date: nextMonth.toISOString().split('T')[0],
      description: "Labor Day"
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date().toISOString();
    const user: User = { ...insertUser, id, createdAt, refreshToken: null };
    this.users.set(id, user);
    return user;
  }

  async updateUserRefreshToken(userId: number, refreshToken: string | null): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...user, refreshToken };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Student Management
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.userId === userId,
    );
  }

  async getStudentByUrn(urn: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.urn === urn,
    );
  }

  async getStudentWithUser(id: number): Promise<StudentWithUser | undefined> {
    const student = await this.getStudent(id);
    if (!student) return undefined;
    
    const user = await this.getUser(student.userId);
    if (!user) return undefined;
    
    return { ...student, user };
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getAllStudentsWithFilters(filters: { year?: number; department?: string; routeId?: number }): Promise<Student[]> {
    let students = Array.from(this.students.values());
    
    if (filters.year) {
      students = students.filter(student => student.year === filters.year);
    }
    
    if (filters.department) {
      students = students.filter(student => student.department === filters.department);
    }
    
    if (filters.routeId) {
      students = students.filter(student => student.routeId === filters.routeId);
    }
    
    return students;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const createdAt = new Date().toISOString();
    const student: Student = { ...insertStudent, id, createdAt };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    const student = await this.getStudent(id);
    if (!student) {
      throw new Error('Student not found');
    }
    
    const updatedStudent = { ...student, ...data };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  // Route Management
  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRouteWithStops(id: number): Promise<RouteWithStops | undefined> {
    const route = await this.getRoute(id);
    if (!route) return undefined;
    
    const routeStopsArr = await this.getRouteStopsByRoute(id);
    const stops: (Stop & { arrivalTime: string; stopOrder: number })[] = [];
    
    for (const routeStop of routeStopsArr) {
      const stop = await this.getStop(routeStop.stopId);
      if (stop) {
        stops.push({
          ...stop,
          arrivalTime: routeStop.arrivalTime || '',
          stopOrder: routeStop.stopOrder
        });
      }
    }
    
    // Sort stops by their order
    stops.sort((a, b) => a.stopOrder - b.stopOrder);
    
    return { ...route, stops };
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = this.currentRouteId++;
    const createdAt = new Date().toISOString();
    const route: Route = { ...insertRoute, id, createdAt };
    this.routes.set(id, route);
    return route;
  }

  async updateRoute(id: number, data: Partial<Route>): Promise<Route> {
    const route = await this.getRoute(id);
    if (!route) {
      throw new Error('Route not found');
    }
    
    const updatedRoute = { ...route, ...data };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  async deleteRoute(id: number): Promise<boolean> {
    return this.routes.delete(id);
  }

  // Stop Management
  async getStop(id: number): Promise<Stop | undefined> {
    return this.stops.get(id);
  }

  async getAllStops(): Promise<Stop[]> {
    return Array.from(this.stops.values());
  }

  async createStop(insertStop: InsertStop): Promise<Stop> {
    const id = this.currentStopId++;
    const createdAt = new Date().toISOString();
    const stop: Stop = { ...insertStop, id, createdAt };
    this.stops.set(id, stop);
    return stop;
  }

  async updateStop(id: number, data: Partial<Stop>): Promise<Stop> {
    const stop = await this.getStop(id);
    if (!stop) {
      throw new Error('Stop not found');
    }
    
    const updatedStop = { ...stop, ...data };
    this.stops.set(id, updatedStop);
    return updatedStop;
  }

  async deleteStop(id: number): Promise<boolean> {
    return this.stops.delete(id);
  }

  // Route Stops Management
  async getRouteStop(id: number): Promise<RouteStop | undefined> {
    return this.routeStops.get(id);
  }

  async getRouteStopsByRoute(routeId: number): Promise<RouteStop[]> {
    return Array.from(this.routeStops.values()).filter(
      (routeStop) => routeStop.routeId === routeId,
    );
  }

  async createRouteStop(insertRouteStop: InsertRouteStop): Promise<RouteStop> {
    const id = this.currentRouteStopId++;
    const createdAt = new Date().toISOString();
    const routeStop: RouteStop = { ...insertRouteStop, id, createdAt };
    this.routeStops.set(id, routeStop);
    return routeStop;
  }

  async updateRouteStop(id: number, data: Partial<RouteStop>): Promise<RouteStop> {
    const routeStop = await this.getRouteStop(id);
    if (!routeStop) {
      throw new Error('RouteStop not found');
    }
    
    const updatedRouteStop = { ...routeStop, ...data };
    this.routeStops.set(id, updatedRouteStop);
    return updatedRouteStop;
  }

  async deleteRouteStop(id: number): Promise<boolean> {
    return this.routeStops.delete(id);
  }

  // Bus Management
  async getBus(id: number): Promise<Bus | undefined> {
    return this.buses.get(id);
  }

  async getBusByNumber(busNumber: string): Promise<Bus | undefined> {
    return Array.from(this.buses.values()).find(
      (bus) => bus.busNumber === busNumber,
    );
  }

  async getAllBuses(): Promise<Bus[]> {
    return Array.from(this.buses.values());
  }
  
  async getBusesWithRoute(): Promise<BusWithRoute[]> {
    const buses = await this.getAllBuses();
    const results: BusWithRoute[] = [];
    
    for (const bus of buses) {
      const result: BusWithRoute = { ...bus };
      
      if (bus.routeId) {
        result.route = await this.getRoute(bus.routeId);
      }
      
      // Find driver assigned to this bus
      const driver = Array.from(this.drivers.values()).find(d => d.busId === bus.id);
      if (driver) {
        result.driver = driver;
      }
      
      results.push(result);
    }
    
    return results;
  }

  async createBus(insertBus: InsertBus): Promise<Bus> {
    const id = this.currentBusId++;
    const createdAt = new Date().toISOString();
    const bus: Bus = { ...insertBus, id, createdAt };
    this.buses.set(id, bus);
    return bus;
  }

  async updateBus(id: number, data: Partial<Bus>): Promise<Bus> {
    const bus = await this.getBus(id);
    if (!bus) {
      throw new Error('Bus not found');
    }
    
    const updatedBus = { ...bus, ...data };
    this.buses.set(id, updatedBus);
    return updatedBus;
  }

  async deleteBus(id: number): Promise<boolean> {
    return this.buses.delete(id);
  }

  // Driver Management
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async getDriverByUserId(userId: number): Promise<Driver | undefined> {
    return Array.from(this.drivers.values()).find(
      (driver) => driver.userId === userId,
    );
  }

  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.currentDriverId++;
    const createdAt = new Date().toISOString();
    const driver: Driver = { ...insertDriver, id, createdAt };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: number, data: Partial<Driver>): Promise<Driver> {
    const driver = await this.getDriver(id);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    const updatedDriver = { ...driver, ...data };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }

  async deleteDriver(id: number): Promise<boolean> {
    return this.drivers.delete(id);
  }

  // Bus Location Management
  async getBusLocation(busId: number): Promise<BusLocation | undefined> {
    return Array.from(this.busLocations.values()).find(
      (location) => location.busId === busId,
    );
  }

  async getAllBusLocations(): Promise<BusLocation[]> {
    return Array.from(this.busLocations.values());
  }

  async getBusLocationsWithInfo(): Promise<BusLocationWithInfo[]> {
    const busLocations = await this.getAllBusLocations();
    const results: BusLocationWithInfo[] = [];
    
    for (const location of busLocations) {
      const bus = await this.getBus(location.busId);
      if (!bus) continue;
      
      const result: BusLocationWithInfo = {
        busId: location.busId,
        busNumber: bus.busNumber,
        latitude: location.latitude,
        longitude: location.longitude
      };
      
      if (bus.routeId) {
        const route = await this.getRoute(bus.routeId);
        if (route) {
          result.routeName = route.name;
          
          // Get route stops to find next stop
          const routeWithStops = await this.getRouteWithStops(bus.routeId);
          if (routeWithStops && routeWithStops.stops.length > 0) {
            result.nextStop = routeWithStops.stops[0].name;
            result.eta = "7 minutes"; // Demo value
          }
        }
      }
      
      results.push(result);
    }
    
    return results;
  }

  async updateBusLocation(insertBusLocation: InsertBusLocation): Promise<BusLocation> {
    const existingLocation = await this.getBusLocation(insertBusLocation.busId);
    
    if (existingLocation) {
      // Update existing location
      const updatedLocation: BusLocation = {
        ...existingLocation,
        latitude: insertBusLocation.latitude,
        longitude: insertBusLocation.longitude,
        speed: insertBusLocation.speed,
        timestamp: new Date().toISOString()
      };
      
      this.busLocations.set(existingLocation.id, updatedLocation);
      return updatedLocation;
    } else {
      // Create new location
      const id = this.currentBusLocationId++;
      const timestamp = new Date().toISOString();
      const busLocation: BusLocation = { ...insertBusLocation, id, timestamp };
      this.busLocations.set(id, busLocation);
      return busLocation;
    }
  }

  // Subscription Management
  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getActiveSubscriptionByStudent(studentId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.studentId === studentId && sub.active === true,
    );
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const createdAt = new Date().toISOString();
    const subscription: Subscription = { ...insertSubscription, id, createdAt };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription> {
    const subscription = await this.getSubscription(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    const updatedSubscription = { ...subscription, ...data };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  // Payment Management
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByStudent(studentId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.studentId === studentId,
    );
  }

  async getPaymentsBySubscription(subscriptionId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.subscriptionId === subscriptionId,
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const createdAt = new Date().toISOString();
    const payment: Payment = { ...insertPayment, id, createdAt };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, data: Partial<Payment>): Promise<Payment> {
    const payment = await this.getPayment(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    const updatedPayment = { ...payment, ...data };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Announcement Management
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values());
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = this.currentAnnouncementId++;
    const createdAt = new Date().toISOString();
    const announcement: Announcement = { ...insertAnnouncement, id, createdAt };
    this.announcements.set(id, announcement);
    return announcement;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    return this.announcements.delete(id);
  }

  // Activity Log Management
  async createActivityLog(log: { userId?: number; action: string; details?: string; ipAddress?: string }): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const createdAt = new Date().toISOString();
    const activityLog: ActivityLog = { 
      id, 
      userId: log.userId, 
      action: log.action, 
      details: log.details || null, 
      ipAddress: log.ipAddress || null, 
      createdAt 
    };
    
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }

  async getRecentActivities(limit: number): Promise<RecentActivity[]> {
    const logs = Array.from(this.activityLogs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    const result: RecentActivity[] = [];
    
    for (const log of logs) {
      let name = 'Unknown User';
      let identifier = '';
      
      if (log.userId) {
        const user = await this.getUser(log.userId);
        if (user) {
          if (user.role === 'student') {
            const student = await this.getStudentByUserId(user.id);
            if (student) {
              name = student.name;
              identifier = student.urn;
            } else {
              name = user.username;
              identifier = user.email;
            }
          } else {
            name = user.username;
            identifier = user.email;
          }
        }
      }
      
      result.push({
        id: log.id,
        action: log.action,
        user: {
          id: log.userId || 0,
          name,
          identifier
        },
        details: log.details || '',
        timestamp: log.createdAt
      });
    }
    
    return result;
  }

  // Holiday Management
  async getHoliday(id: number): Promise<Holiday | undefined> {
    return this.holidays.get(id);
  }

  async getAllHolidays(): Promise<Holiday[]> {
    return Array.from(this.holidays.values());
  }

  async createHoliday(insertHoliday: InsertHoliday): Promise<Holiday> {
    const id = this.currentHolidayId++;
    const createdAt = new Date().toISOString();
    const holiday: Holiday = { ...insertHoliday, id, createdAt };
    this.holidays.set(id, holiday);
    return holiday;
  }

  async deleteHoliday(id: number): Promise<boolean> {
    return this.holidays.delete(id);
  }

  // Dashboard Stats
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const totalStudents = this.students.size;
    const totalBuses = this.buses.size;
    const totalRoutes = this.routes.size;
    
    // Calculate pending fees
    let pendingFees = 0;
    const allPayments = Array.from(this.payments.values());
    const pendingPayments = allPayments.filter(p => p.status === 'pending');
    
    pendingPayments.forEach(payment => {
      pendingFees += payment.amount;
    });
    
    return {
      totalStudents,
      totalBuses,
      totalRoutes,
      pendingFees
    };
  }
}

export const storage = new MemStorage();
