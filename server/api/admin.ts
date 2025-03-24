import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { hashPassword } from "../auth";

export function setupAdminRoutes(router: Router, requireAuth: any, requireAdmin: any) {
  // Create new user (admin only)
  router.post("/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Validate the request body against the schema
      const parseResult = insertUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: parseResult.error.errors 
        });
      }
      
      // Check if the username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create the user
      const newUser = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      // Create user profile if profile data was provided
      if (req.body.firstName || req.body.lastName || req.body.email || req.body.department || req.body.position) {
        await storage.createUserProfile({
          userId: newUser.id,
          firstName: req.body.firstName || null,
          lastName: req.body.lastName || null,
          email: req.body.email || null,
          department: req.body.department || null,
          position: req.body.position || null,
          about: null,
          avatarUrl: null,
        });
      }
      
      // Return the user data without the password
      const { password, ...userData } = newUser;
      res.status(201).json(userData);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  // Get all users (admin only)
  router.get("/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Get profiles for each user
      const usersWithProfiles = await Promise.all(
        users.map(async (user) => {
          const profile = await storage.getUserProfile(user.id);
          return {
            ...user,
            profile
          };
        })
      );
      
      res.json(usersWithProfiles);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Toggle user admin status (admin only)
  router.patch("/admin/users/:id/toggle-admin", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Don't allow admin to remove their own admin privileges
      if (req.user && req.user.id === userId) {
        return res.status(403).json({ message: "Cannot change your own admin status" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle the user's admin status (flip current value)
      const success = await storage.updateUserAdminStatus(userId, !user.isAdmin);
      
      if (success) {
        // Get the updated user to return in response
        const updatedUser = await storage.getUser(userId);
        return res.json({
          message: `User admin status updated to ${!user.isAdmin}`,
          user: updatedUser
        });
      } else {
        return res.status(500).json({ message: "Failed to update admin status" });
      }
    } catch (error) {
      console.error("Error toggling admin status:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get global API settings (admin only)
  router.get("/admin/settings/api", requireAdmin, async (req: Request, res: Response) => {
    try {
      // In a real application, we would fetch global settings from the database
      // For now, we'll return a mock response
      res.json({
        useAdminApiKeyForAll: true,
        allowUserApiConfig: false,
        enableAdvancedFeatures: true
      });
    } catch (error) {
      console.error("Error fetching global API settings:", error);
      res.status(500).json({ message: "Failed to fetch global API settings" });
    }
  });

  // Update global API settings (admin only)
  router.patch("/admin/settings/api", requireAdmin, async (req: Request, res: Response) => {
    try {
      // In a real application, we would update global settings in the database
      // For now, we'll just return the request body
      res.json(req.body);
    } catch (error) {
      console.error("Error updating global API settings:", error);
      res.status(500).json({ message: "Failed to update global API settings" });
    }
  });
}