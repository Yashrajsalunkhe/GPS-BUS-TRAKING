import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { loginSchema, insertUserSchema, insertStudentSchema } from '@shared/schema';
import { z, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Secret keys for JWT (normally would come from environment variables)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret_key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key';

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Generate JWT tokens
export const generateTokens = (payload: { id: number; username: string; role: string }) => {
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  
  return { accessToken, refreshToken };
};

// Middleware to verify JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired access token' });
    }
    
    req.user = user as { id: number; username: string; role: string };
    next();
  });
};

// Middleware to check user role
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }
    
    next();
  };
};

// Login handler
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by username
    const user = await storage.getUserByUsername(validatedData.username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(validatedData.password, user.password);
    
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    // Save refresh token to user
    await storage.updateUserRefreshToken(user.id, tokens.refreshToken);
    
    // Return tokens and user info
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
    // Log activity
    await storage.createActivityLog({
      userId: user.id,
      action: 'User Login',
      ipAddress: req.ip
    });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.format() });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Register student handler
export const registerStudent = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      email: z.string().email(),
      urn: z.string().min(3),
      name: z.string(),
      mobile: z.string(),
      address: z.string(),
      year: z.number().min(1).max(4),
      department: z.string(),
      routeId: z.number().optional(),
      profilePicture: z.string().optional()
    }).parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(validatedData.email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Check if URN already exists
    const existingUrn = await storage.getStudentByUrn(validatedData.urn);
    if (existingUrn) {
      return res.status(400).json({ message: 'URN already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user
    const user = await storage.createUser({
      username: validatedData.username,
      password: hashedPassword,
      email: validatedData.email,
      role: 'student'
    });
    
    // Create student profile
    const student = await storage.createStudent({
      userId: user.id,
      urn: validatedData.urn,
      name: validatedData.name,
      email: validatedData.email,
      mobile: validatedData.mobile,
      address: validatedData.address,
      year: validatedData.year,
      department: validatedData.department,
      profilePicture: validatedData.profilePicture,
      routeId: validatedData.routeId
    });
    
    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    // Save refresh token to user
    await storage.updateUserRefreshToken(user.id, tokens.refreshToken);
    
    // Return tokens and user info
    res.status(201).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      student: {
        id: student.id,
        urn: student.urn,
        name: student.name
      }
    });
    
    // Log activity
    await storage.createActivityLog({
      userId: user.id,
      action: 'User Registration',
      details: `New student registered with URN: ${student.urn}`,
      ipAddress: req.ip
    });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.format() });
    }
    
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Refresh token handler
export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as jwt.JwtPayload;
    
    // Get user
    const user = await storage.getUser(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    // Update refresh token
    await storage.updateUserRefreshToken(user.id, tokens.refreshToken);
    
    // Return new tokens
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
    
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

// Logout handler
export const logout = async (req: Request, res: Response) => {
  try {
    if (req.user) {
      // Clear refresh token from user
      await storage.updateUserRefreshToken(req.user.id, null);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'User Logout',
        ipAddress: req.ip
      });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
