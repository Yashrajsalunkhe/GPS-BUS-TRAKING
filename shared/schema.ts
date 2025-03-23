import { pgTable, text, serial, integer, boolean, date, time, timestamp, real, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Authentication Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("student"), // student, admin, driver
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student Profile Table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  urn: text("urn").notNull().unique(), // Unique Roll Number
  name: text("name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address").notNull(),
  year: integer("year").notNull(),
  department: text("department").notNull(),
  profilePicture: text("profile_picture"),
  routeId: integer("route_id").references(() => routes.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bus Routes Table
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bus Stops Table
export const stops = pgTable("stops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Route Stops (Many-to-Many between Routes and Stops)
export const routeStops = pgTable("route_stops", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => routes.id),
  stopId: integer("stop_id").notNull().references(() => stops.id),
  stopOrder: integer("stop_order").notNull(), // Order of the stop in the route
  arrivalTime: time("arrival_time"), // Estimated arrival time
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Buses Table
export const buses = pgTable("buses", {
  id: serial("id").primaryKey(),
  busNumber: text("bus_number").notNull().unique(),
  capacity: integer("capacity").notNull().default(50),
  model: text("model"),
  routeId: integer("route_id").references(() => routes.id),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Drivers Table
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  licenseNumber: text("license_number").notNull(),
  address: text("address"),
  busId: integer("bus_id").references(() => buses.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bus Location (Real-time tracking)
export const busLocations = pgTable("bus_locations", {
  id: serial("id").primaryKey(),
  busId: integer("bus_id").notNull().references(() => buses.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  speed: real("speed"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Subscriptions (For bus pass)
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  amount: real("amount").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  amount: real("amount").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: text("payment_method").notNull(),
  transactionId: text("transaction_id"),
  status: text("status").notNull(), // pending, completed, failed
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Holiday Calendar
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  refreshToken: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertStopSchema = createInsertSchema(stops).omit({
  id: true,
  createdAt: true,
});

export const insertRouteStopSchema = createInsertSchema(routeStops).omit({
  id: true,
  createdAt: true,
});

export const insertBusSchema = createInsertSchema(buses).omit({
  id: true,
  createdAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export const insertBusLocationSchema = createInsertSchema(busLocations).omit({
  id: true,
  timestamp: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertHolidaySchema = createInsertSchema(holidays).omit({
  id: true,
  createdAt: true,
});

// Define types for the insert schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type InsertStop = z.infer<typeof insertStopSchema>;
export type InsertRouteStop = z.infer<typeof insertRouteStopSchema>;
export type InsertBus = z.infer<typeof insertBusSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBusLocation = z.infer<typeof insertBusLocationSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;

// Define select types
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Stop = typeof stops.$inferSelect;
export type RouteStop = typeof routeStops.$inferSelect;
export type Bus = typeof buses.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type BusLocation = typeof busLocations.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Holiday = typeof holidays.$inferSelect;

// Additional schemas for client-side validation
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerStudentSchema = insertUserSchema.merge(
  insertStudentSchema.omit({ userId: true })
).extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
