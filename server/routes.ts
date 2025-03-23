import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { 
  authenticateToken, 
  requireRole, 
  login, 
  registerStudent, 
  refreshToken, 
  logout 
} from "./auth";
import { 
  loginSchema, 
  insertRouteSchema, 
  insertStopSchema, 
  insertBusSchema, 
  insertDriverSchema, 
  insertSubscriptionSchema, 
  insertPaymentSchema, 
  insertAnnouncementSchema, 
  insertHolidaySchema 
} from "@shared/schema";
import bcrypt from "bcrypt";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import Stripe from "stripe";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer);
  
  //-------------------------------------
  // Authentication Routes
  //-------------------------------------
  
  // Login route
  app.post("/api/auth/login", login);
  
  // Register student route
  app.post("/api/auth/register", registerStudent);
  
  // Refresh token route
  app.post("/api/auth/refresh-token", refreshToken);
  
  // Logout route
  app.post("/api/auth/logout", authenticateToken, logout);
  
  //-------------------------------------
  // Student Routes
  //-------------------------------------
  
  // Get student profile
  app.get("/api/student/profile", authenticateToken, async (req, res) => {
    try {
      const student = await storage.getStudentByUserId(req.user!.id);
      
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      res.json(student);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get student bus pass (active subscription)
  app.get("/api/student/bus-pass", authenticateToken, async (req, res) => {
    try {
      const student = await storage.getStudentByUserId(req.user!.id);
      
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      const subscription = await storage.getActiveSubscriptionByStudent(student.id);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      
      // Get route name
      let routeName = '';
      if (student.routeId) {
        const route = await storage.getRoute(student.routeId);
        if (route) {
          routeName = route.name;
        }
      }
      
      // Create bus pass data
      const busPass = {
        studentName: student.name,
        studentUrn: student.urn,
        validUntil: subscription.endDate,
        route: routeName,
        active: subscription.active
      };
      
      res.json(busPass);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get student payments
  app.get("/api/student/payments", authenticateToken, async (req, res) => {
    try {
      const student = await storage.getStudentByUserId(req.user!.id);
      
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      const payments = await storage.getPaymentsByStudent(student.id);
      res.json(payments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get student subscription
  app.get("/api/student/subscription", authenticateToken, async (req, res) => {
    try {
      const student = await storage.getStudentByUserId(req.user!.id);
      
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      const subscription = await storage.getActiveSubscriptionByStudent(student.id);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      
      // Add payment history to subscription
      const payments = await storage.getPaymentsBySubscription(subscription.id);
      
      res.json({
        ...subscription,
        payments
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create new payment
  app.post("/api/student/payments", authenticateToken, async (req, res) => {
    try {
      const student = await storage.getStudentByUserId(req.user!.id);
      
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        studentId: student.id,
        paymentDate: new Date().toISOString(),
        status: 'pending', // Payments start as pending until confirmed
      });
      
      const payment = await storage.createPayment(paymentData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Payment Created',
        details: `Payment of ${payment.amount} created`,
        ipAddress: req.ip
      });
      
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update student profile
  app.patch("/api/student/profile", authenticateToken, async (req, res) => {
    try {
      const student = await storage.getStudentByUserId(req.user!.id);
      
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      // Validate update data
      const updateSchema = z.object({
        name: z.string().optional(),
        mobile: z.string().optional(),
        address: z.string().optional(),
        year: z.number().min(1).max(4).optional(),
        department: z.string().optional(),
        profilePicture: z.string().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      // Update the student
      const updatedStudent = await storage.updateStudent(student.id, updateData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Profile Updated',
        ipAddress: req.ip
      });
      
      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //-------------------------------------
  // Route and Stop API
  //-------------------------------------
  
  // Get all routes
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get route with stops
  app.get("/api/routes/:id", async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      const route = await storage.getRouteWithStops(routeId);
      
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      res.json(route);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create route (admin only)
  app.post("/api/routes", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const routeData = insertRouteSchema.parse(req.body);
      const route = await storage.createRoute(routeData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Route Created',
        details: `Route "${route.name}" created`,
        ipAddress: req.ip
      });
      
      res.status(201).json(route);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update route (admin only)
  app.patch("/api/routes/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      
      // Validate update data
      const updateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        active: z.boolean().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      // Update the route
      const updatedRoute = await storage.updateRoute(routeId, updateData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Route Updated',
        details: `Route "${updatedRoute.name}" updated`,
        ipAddress: req.ip
      });
      
      res.json(updatedRoute);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete route (admin only)
  app.delete("/api/routes/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      
      // Get the route before deleting it
      const route = await storage.getRoute(routeId);
      
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      const deleted = await storage.deleteRoute(routeId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Route Deleted',
        details: `Route "${route.name}" deleted`,
        ipAddress: req.ip
      });
      
      res.json({ message: 'Route deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get all stops
  app.get("/api/stops", async (req, res) => {
    try {
      const stops = await storage.getAllStops();
      res.json(stops);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create stop (admin only)
  app.post("/api/stops", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const stopData = insertStopSchema.parse(req.body);
      const stop = await storage.createStop(stopData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Stop Created',
        details: `Stop "${stop.name}" created`,
        ipAddress: req.ip
      });
      
      res.status(201).json(stop);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Associate stop with route (admin only)
  app.post("/api/routes/:routeId/stops", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      
      // Validate data
      const schema = z.object({
        stopId: z.number(),
        stopOrder: z.number(),
        arrivalTime: z.string().optional()
      });
      
      const data = schema.parse(req.body);
      
      // Create route stop association
      const routeStop = await storage.createRouteStop({
        routeId,
        stopId: data.stopId,
        stopOrder: data.stopOrder,
        arrivalTime: data.arrivalTime
      });
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Stop Added to Route',
        details: `Stop added to route`,
        ipAddress: req.ip
      });
      
      res.status(201).json(routeStop);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //-------------------------------------
  // Bus Management API
  //-------------------------------------
  
  // Get all buses
  app.get("/api/buses", async (req, res) => {
    try {
      const buses = await storage.getAllBuses();
      res.json(buses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get buses with routes
  app.get("/api/buses/with-routes", async (req, res) => {
    try {
      const buses = await storage.getBusesWithRoute();
      res.json(buses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get bus by ID
  app.get("/api/buses/:id", async (req, res) => {
    try {
      const busId = parseInt(req.params.id);
      const bus = await storage.getBus(busId);
      
      if (!bus) {
        return res.status(404).json({ message: 'Bus not found' });
      }
      
      res.json(bus);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create bus (admin only)
  app.post("/api/buses", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const busData = insertBusSchema.parse(req.body);
      const bus = await storage.createBus(busData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Bus Created',
        details: `Bus "${bus.busNumber}" created`,
        ipAddress: req.ip
      });
      
      res.status(201).json(bus);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update bus (admin only)
  app.patch("/api/buses/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const busId = parseInt(req.params.id);
      
      // Validate update data
      const updateSchema = z.object({
        busNumber: z.string().optional(),
        capacity: z.number().optional(),
        model: z.string().optional(),
        routeId: z.number().optional(),
        active: z.boolean().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      // Update the bus
      const updatedBus = await storage.updateBus(busId, updateData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Bus Updated',
        details: `Bus "${updatedBus.busNumber}" updated`,
        ipAddress: req.ip
      });
      
      res.json(updatedBus);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete bus (admin only)
  app.delete("/api/buses/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const busId = parseInt(req.params.id);
      
      // Get the bus before deleting it
      const bus = await storage.getBus(busId);
      
      if (!bus) {
        return res.status(404).json({ message: 'Bus not found' });
      }
      
      const deleted = await storage.deleteBus(busId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Bus not found' });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Bus Deleted',
        details: `Bus "${bus.busNumber}" deleted`,
        ipAddress: req.ip
      });
      
      res.json({ message: 'Bus deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //-------------------------------------
  // Driver Management API
  //-------------------------------------
  
  // Get all drivers
  app.get("/api/drivers", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create driver (admin only)
  app.post("/api/drivers", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      // Create driver user account first
      const userData = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        email: z.string().email(),
      }).parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        role: 'driver'
      });
      
      // Create driver profile
      const driverData = insertDriverSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const driver = await storage.createDriver(driverData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Driver Created',
        details: `Driver "${driver.name}" created`,
        ipAddress: req.ip
      });
      
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update driver (admin only)
  app.patch("/api/drivers/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      
      // Validate update data
      const updateSchema = z.object({
        name: z.string().optional(),
        mobile: z.string().optional(),
        licenseNumber: z.string().optional(),
        address: z.string().optional(),
        busId: z.number().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      // Update the driver
      const updatedDriver = await storage.updateDriver(driverId, updateData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Driver Updated',
        details: `Driver "${updatedDriver.name}" updated`,
        ipAddress: req.ip
      });
      
      res.json(updatedDriver);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete driver (admin only)
  app.delete("/api/drivers/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      
      // Get the driver before deleting it
      const driver = await storage.getDriver(driverId);
      
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      const deleted = await storage.deleteDriver(driverId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Driver Deleted',
        details: `Driver "${driver.name}" deleted`,
        ipAddress: req.ip
      });
      
      res.json({ message: 'Driver deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //-------------------------------------
  // Student Management API (Admin)
  //-------------------------------------
  
  // Get all students (admin only)
  app.get("/api/admin/students", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      // Get query parameters for filtering
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const department = req.query.department as string;
      const routeId = req.query.routeId ? parseInt(req.query.routeId as string) : undefined;
      
      // Get students with filters
      const students = await storage.getAllStudentsWithFilters({
        year,
        department,
        routeId
      });
      
      res.json(students);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create student (admin only)
  app.post("/api/admin/students", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      // Create student user account first
      const userData = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        email: z.string().email(),
      }).parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        role: 'student'
      });
      
      // Create student profile
      const studentData = z.object({
        urn: z.string().min(3),
        name: z.string(),
        mobile: z.string(),
        address: z.string(),
        year: z.number().min(1).max(4),
        department: z.string(),
        routeId: z.number().optional(),
        profilePicture: z.string().optional()
      }).parse(req.body);
      
      // Check if URN already exists
      const existingUrn = await storage.getStudentByUrn(studentData.urn);
      if (existingUrn) {
        return res.status(400).json({ message: 'URN already exists' });
      }
      
      const student = await storage.createStudent({
        userId: user.id,
        email: userData.email,
        ...studentData
      });
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Student Created',
        details: `Student "${student.name}" with URN "${student.urn}" created`,
        ipAddress: req.ip
      });
      
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update student (admin only)
  app.patch("/api/admin/students/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Validate update data
      const updateSchema = z.object({
        name: z.string().optional(),
        mobile: z.string().optional(),
        address: z.string().optional(),
        year: z.number().min(1).max(4).optional(),
        department: z.string().optional(),
        routeId: z.number().optional(),
        profilePicture: z.string().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      // Update the student
      const updatedStudent = await storage.updateStudent(studentId, updateData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Student Updated',
        details: `Student "${updatedStudent.name}" updated`,
        ipAddress: req.ip
      });
      
      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete student (admin only)
  app.delete("/api/admin/students/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Get the student before deleting it
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      const deleted = await storage.deleteStudent(studentId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Student Deleted',
        details: `Student "${student.name}" with URN "${student.urn}" deleted`,
        ipAddress: req.ip
      });
      
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //-------------------------------------
  // Subscription and Payment API (Admin)
  //-------------------------------------
  
  // Create subscription for student (admin only)
  app.post("/api/admin/students/:id/subscription", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Check if student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Validate subscription data
      const subscriptionData = insertSubscriptionSchema.parse({
        ...req.body,
        studentId
      });
      
      // Create subscription
      const subscription = await storage.createSubscription(subscriptionData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Subscription Created',
        details: `Subscription created for student "${student.name}"`,
        ipAddress: req.ip
      });
      
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create payment for student (admin only)
  app.post("/api/admin/students/:id/payments", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Check if student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Validate payment data
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        studentId,
        paymentDate: new Date().toISOString()
      });
      
      // Create payment
      const payment = await storage.createPayment(paymentData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Payment Created',
        details: `Payment of ${payment.amount} created for student "${student.name}"`,
        ipAddress: req.ip
      });
      
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update payment status (admin only)
  app.patch("/api/admin/payments/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      
      // Validate update data
      const updateSchema = z.object({
        status: z.enum(['pending', 'completed', 'failed']),
        transactionId: z.string().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      // Update the payment
      const updatedPayment = await storage.updatePayment(paymentId, updateData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Payment Updated',
        details: `Payment status updated to "${updateData.status}"`,
        ipAddress: req.ip
      });
      
      res.json(updatedPayment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //-------------------------------------
  // Announcements and Holidays API
  //-------------------------------------
  
  // Get all announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create announcement (admin only)
  app.post("/api/announcements", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });
      
      const announcement = await storage.createAnnouncement(announcementData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Announcement Created',
        details: `Announcement "${announcement.title}" created`,
        ipAddress: req.ip
      });
      
      res.status(201).json(announcement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete announcement (admin only)
  app.delete("/api/announcements/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      
      // Get the announcement before deleting it
      const announcement = await storage.getAnnouncement(announcementId);
      
      if (!announcement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      
      const deleted = await storage.deleteAnnouncement(announcementId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Announcement Deleted',
        details: `Announcement "${announcement.title}" deleted`,
        ipAddress: req.ip
      });
      
      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get all holidays
  app.get("/api/holidays", async (req, res) => {
    try {
      const holidays = await storage.getAllHolidays();
      res.json(holidays);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create holiday (admin only)
  app.post("/api/holidays", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const holidayData = insertHolidaySchema.parse(req.body);
      const holiday = await storage.createHoliday(holidayData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Holiday Created',
        details: `Holiday "${holiday.description}" on ${holiday.date} created`,
        ipAddress: req.ip
      });
      
      res.status(201).json(holiday);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.format() });
      }
      
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete holiday (admin only)
  app.delete("/api/holidays/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const holidayId = parseInt(req.params.id);
      
      // Get the holiday before deleting it
      const holiday = await storage.getHoliday(holidayId);
      
      if (!holiday) {
        return res.status(404).json({ message: 'Holiday not found' });
      }
      
      const deleted = await storage.deleteHoliday(holidayId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Holiday not found' });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: 'Holiday Deleted',
        details: `Holiday "${holiday.description}" deleted`,
        ipAddress: req.ip
      });
      
      res.json({ message: 'Holiday deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //-------------------------------------
  // Dashboard Stats API
  //-------------------------------------
  
  // Get admin dashboard stats
  app.get("/api/admin/dashboard/stats", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get bus locations
  app.get("/api/bus-locations", async (req, res) => {
    try {
      const busLocations = await storage.getBusLocationsWithInfo();
      res.json(busLocations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get recent activities (admin only)
  app.get("/api/admin/activities", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  return httpServer;
}
