import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCourseSchema, insertModuleSchema, insertMaterialSchema, insertCourseProgressSchema } from "@shared/schema";

export function setupCoursesRoutes(router: Router, requireAuth: any, requireAdmin: any) {
  // Get all courses
  router.get("/courses", async (req: Request, res: Response) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get a specific course
  router.get("/courses/:id", async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Create a new course (admin only)
  router.post("/courses", requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Update a course (admin only)
  router.patch("/courses/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const updatedCourse = await storage.updateCourse(req.params.id, req.body);
      res.json(updatedCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // Delete a course (soft delete) (admin only)
  router.delete("/courses/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      await storage.deleteCourse(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });
  
  // Hard delete a course (admin only)
  router.delete("/courses/:id/hard", requireAdmin, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      await storage.hardDeleteCourse(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to hard delete course" });
    }
  });
  
  // Recover a deleted course (admin only)
  router.post("/courses/:id/recover", requireAdmin, async (req: Request, res: Response) => {
    try {
      const recoveredCourse = await storage.recoverCourse(req.params.id);
      
      if (!recoveredCourse) {
        return res.status(404).json({ message: "Course not found or not deleted" });
      }
      
      res.json(recoveredCourse);
    } catch (error) {
      res.status(500).json({ message: "Failed to recover course" });
    }
  });
  
  // Get deleted courses (admin only)
  router.get("/courses/deleted", requireAdmin, async (req: Request, res: Response) => {
    try {
      const deletedCourses = await storage.getDeletedCourses();
      res.json(deletedCourses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deleted courses" });
    }
  });

  // Get course modules
  router.get("/courses/:id/modules", async (req: Request, res: Response) => {
    try {
      const modules = await storage.getCourseModules(req.params.id);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  // Get a specific module
  router.get("/courses/:courseId/modules/:moduleId", async (req: Request, res: Response) => {
    try {
      const module = await storage.getModule(req.params.moduleId);
      
      if (!module || module.courseId !== req.params.courseId) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(module);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  // Create a new module (admin only)
  router.post("/courses/:id/modules", requireAdmin, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const validatedData = insertModuleSchema.parse({
        ...req.body,
        courseId: req.params.id
      });
      
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid module data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  // Update a module (admin only)
  router.patch("/courses/:courseId/modules/:moduleId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const module = await storage.getModule(req.params.moduleId);
      
      if (!module || module.courseId !== req.params.courseId) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const updatedModule = await storage.updateModule(req.params.moduleId, req.body);
      res.json(updatedModule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid module data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  // Set current module
  router.post("/courses/:courseId/modules/:moduleId/start", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { courseId, moduleId } = req.params;
      
      // Check if the course and module exist
      const course = await storage.getCourse(courseId);
      const module = await storage.getModule(moduleId);
      
      if (!course || !module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Course or module not found" });
      }
      
      // Get or create user progress for this course
      let progress = await storage.getUserCourseProgress(userId, courseId);
      
      if (progress) {
        // Update current module
        progress = await storage.updateUserCourseProgress(progress.id, {
          currentModuleId: moduleId,
          currentModuleOrder: module.order
        });
      } else {
        // Create new progress entry
        progress = await storage.createUserCourseProgress({
          userId,
          courseId,
          currentModuleId: moduleId,
          currentModuleOrder: module.order,
          progress: 0,
          completed: false
        });
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to set current module" });
    }
  });

  // Update module progress
  router.post("/courses/:courseId/modules/:moduleId/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { courseId, moduleId } = req.params;
      const { progress } = req.body;
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "Invalid progress value" });
      }
      
      // Check if the course and module exist
      const course = await storage.getCourse(courseId);
      const module = await storage.getModule(moduleId);
      
      if (!course || !module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Course or module not found" });
      }
      
      // Get user progress for this course
      let userProgress = await storage.getUserCourseProgress(userId, courseId);
      
      if (userProgress) {
        // Calculate overall course progress based on number of modules
        const modules = await storage.getCourseModules(courseId);
        const moduleCount = modules.length;
        const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
        
        // Calculate new overall progress
        // Completed modules + current module progress percentage
        const completedModules = currentModuleIndex;
        const newProgress = Math.round(((completedModules / moduleCount) * 100) + ((progress / 100) * (100 / moduleCount)));
        
        // Update progress
        userProgress = await storage.updateUserCourseProgress(userProgress.id, {
          progress: Math.min(newProgress, 100)
        });
        
        // Update module completion status if progress is 100%
        if (progress === 100) {
          await storage.updateModuleCompletion(userId, moduleId, true);
          
          // If all modules are completed, mark the course as completed
          const completedModules = await storage.getCompletedModules(userId, courseId);
          if (completedModules.length === moduleCount) {
            await storage.updateUserCourseProgress(userProgress.id, {
              completed: true
            });
          }
        }
      } else {
        // Create new progress entry
        userProgress = await storage.createUserCourseProgress({
          userId,
          courseId,
          currentModuleId: moduleId,
          currentModuleOrder: module.order,
          progress: progress / 100, // Convert percentage to decimal
          completed: false
        });
      }
      
      res.json(userProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Get user's course progress
  router.get("/user/courses/:courseId/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const courseId = req.params.courseId;
      
      const progress = await storage.getUserCourseProgress(userId, courseId);
      
      if (!progress) {
        // Return default progress structure if none exists
        return res.json({
          userId,
          courseId,
          currentModuleId: null,
          currentModuleOrder: 1,
          progress: 0,
          completed: false
        });
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get materials for a course
  router.get("/courses/:id/materials", async (req: Request, res: Response) => {
    try {
      const materials = await storage.getCourseMaterials(req.params.id);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  // Create a new material (admin only)
  router.post("/courses/:id/materials", requireAdmin, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const validatedData = insertMaterialSchema.parse({
        ...req.body,
        courseId: req.params.id
      });
      
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid material data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create material" });
    }
  });

  // Get user's enrolled courses
  router.get("/user/courses", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const courses = await storage.getUserCourses(userId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user courses" });
    }
  });

  // Get user profile
  router.get("/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user profile
  router.patch("/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const updatedProfile = await storage.updateUserProfile(userId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user password
  router.post("/user/password", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      const success = await storage.updateUserPassword(userId, currentPassword, newPassword);
      
      if (!success) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Get user API configuration
  router.get("/user/settings/api", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const apiConfig = await storage.getUserApiConfig(userId);
      
      if (!apiConfig) {
        return res.status(404).json({ message: "API configuration not found" });
      }
      
      res.json(apiConfig);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });

  // Update user API configuration
  router.patch("/user/settings/api", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const apiConfig = await storage.getUserApiConfig(userId);
      
      if (!apiConfig) {
        return res.status(404).json({ message: "API configuration not found" });
      }
      
      const updatedConfig = await storage.updateUserApiConfig(userId, req.body);
      res.json(updatedConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid API configuration", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update API configuration" });
    }
  });
}
