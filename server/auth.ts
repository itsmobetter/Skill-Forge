import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "skill-forge-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check if username contains @ for email login
        let user;
        if (username.includes('@')) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      // If user doesn't exist anymore (e.g., after DB reset), just return null instead of error
      if (!user) {
        console.log(`User with id ${id} not found during deserialization`);
        return done(null, null);
      }
      done(null, user);
    } catch (error) {
      console.error("Error during user deserialization:", error);
      done(null, null); // Return null instead of propagating the error
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      
      // Check if email exists if provided
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).send("Email already exists");
        }
      }

      // Check if this is the first user (will be admin)
      const allUsers = await storage.getAllUsers();
      const isFirstUser = allUsers.length === 0;

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isAdmin: isFirstUser // First user is admin, others are regular users
      });

      // Create default profile for the user
      await storage.createUserProfile({
        userId: user.id,
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        email: req.body.email || null,
        position: req.body.position || null,
        department: req.body.department || null,
        about: null,
        avatarUrl: null
      });

      // Create default API settings
      // Make sure temperature is a number (float) not a string
      const defaultConfig = {
        userId: user.id,
        provider: "Google",
        model: "gemini-1.5-flash", // Use Gemini Flash 1.5 as default
        apiKey: process.env.GEMINI_API_KEY || "",
        endpoint: "",
        temperature: 0.7, // This needs to be a float
        maxTokens: 1024,
        useTranscriptions: true,
        usePdf: true,
        streaming: true
      };

      try {
        await storage.createApiConfig(defaultConfig);
        console.log("API config created successfully for user:", user.id);
      } catch (error) {
        console.error("Error creating API config:", error);
        // Don't let this error stop the user creation process
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("Authentication status:", req.isAuthenticated());
    if (!req.isAuthenticated()) {
      console.log("User not authenticated, returning 401");
      return res.sendStatus(401);
    }
    console.log("User data from /api/user:", req.user);
    res.json(req.user);
  });

  // Authentication middleware for API routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Admin middleware for admin-only routes
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  return { requireAuth, requireAdmin };
}
