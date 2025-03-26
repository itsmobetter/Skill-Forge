import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCourseSchema, insertModuleSchema, insertMaterialSchema, insertCourseProgressSchema } from "@shared/schema";

export function setupCoursesRoutes(router: Router, requireAuth: any, requireAdmin: any) {
  // Get module transcription
  router.get("/modules/:moduleId/transcription", async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      
      if (!moduleId) {
        return res.status(400).json({ message: "Module ID is required" });
      }
      
      const transcription = await storage.getModuleTranscription(moduleId);
      
      if (!transcription) {
        return res.status(404).json({ message: "No transcription found for this module" });
      }
      
      res.json(transcription);
    } catch (error) {
      console.error("Error fetching module transcription:", error);
      res.status(500).json({ message: "Failed to fetch module transcription" });
    }
  });
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

  // Utility function to automatically generate transcription for a module
  async function generateTranscriptionForModule(moduleId: string, videoUrl: string | null): Promise<void> {
    if (!videoUrl) {
      console.log(`[AUTO_TRANSCRIBE] Module ${moduleId} has no video URL, skipping transcription`);
      return;
    }
    
    try {
      console.log(`[AUTO_TRANSCRIBE] Starting automatic transcription for module ${moduleId} with URL ${videoUrl}`);
      
      // Get video ID from YouTube URL
      const videoIdMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      if (!videoId) {
        console.log(`[AUTO_TRANSCRIBE] Invalid YouTube URL: ${videoUrl}`);
        return;
      }
      
      // Check if transcription already exists
      const existingTranscription = await storage.getModuleTranscription(moduleId);
      if (existingTranscription && existingTranscription.text && existingTranscription.text.length > 100) {
        console.log(`[AUTO_TRANSCRIBE] Transcription already exists for module ${moduleId}`);
        return;
      } else if (existingTranscription) {
        console.log(`[AUTO_TRANSCRIBE] Transcription exists but might be incomplete for module ${moduleId}, regenerating...`);
      }
      
      console.log(`[AUTO_TRANSCRIBE] Triggering transcription API for module ${moduleId}, video ${videoId}`);
      
      // Use the internal API to trigger transcription - this will run asynchronously
      const response = await fetch('http://localhost:5000/api/llm/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add admin authorization to the request
          'X-Internal-Request': 'true'
        },
        body: JSON.stringify({
          videoUrl,
          moduleId,
          internal: true // Flag to indicate this is an internal request
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AUTO_TRANSCRIBE] Transcription API returned error: ${response.status} ${errorText}`);
      }
      
      console.log(`[AUTO_TRANSCRIBE] Transcription request sent for module ${moduleId}`);
    } catch (error) {
      console.error(`[AUTO_TRANSCRIBE] Error starting transcription for module ${moduleId}:`, error);
    }
  }

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
      
      // If the module has a video URL, trigger automatic transcription
      if (module.videoUrl) {
        // Start transcription generation in the background
        // We don't await this to avoid blocking the response
        generateTranscriptionForModule(module.id, module.videoUrl)
          .catch(error => console.error('[AUTO_TRANSCRIBE] Background transcription error:', error));
      }
      
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
      
      // Check if video URL has changed
      const oldVideoUrl = module.videoUrl;
      const newVideoUrl = req.body.videoUrl;
      
      const updatedModule = await storage.updateModule(req.params.moduleId, req.body);
      
      // If video URL has changed and new URL is provided, trigger transcription
      if (newVideoUrl && oldVideoUrl !== newVideoUrl) {
        console.log(`[MODULE_UPDATE] Video URL changed from ${oldVideoUrl} to ${newVideoUrl} for module ${module.id}`);
        
        // Start transcription generation in the background
        // We don't await this to avoid blocking the response
        generateTranscriptionForModule(module.id, newVideoUrl)
          .catch(error => console.error('[AUTO_TRANSCRIBE] Background transcription error:', error));
      }
      
      res.json(updatedModule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid module data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update module" });
    }
  });
  
  // Delete a module (admin only)
  router.delete("/courses/:courseId/modules/:moduleId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const module = await storage.getModule(req.params.moduleId);
      
      if (!module || module.courseId !== req.params.courseId) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      await storage.deleteModule(req.params.moduleId);
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
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
      
      console.log(`[MODULE_PROGRESS] User ${userId} updating progress for module ${moduleId} to ${progress}%`);
      
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
      
      // If progress is at least 95%, we consider the module completed
      // This is more lenient than requiring 100% and prevents issues with video tracking
      if (progress >= 95) {
        console.log(`[MODULE_PROGRESS] Marking module ${moduleId} as completed for user ${userId}`);
        
        // Update module completion
        await storage.updateModuleCompletion(userId, moduleId, true);
      }
      
      // Get all modules and calculate overall course progress
      const modules = await storage.getCourseModules(courseId);
      const moduleCount = modules.length;
      const completedModules = await storage.getCompletedModules(userId, courseId);
      
      console.log(`[MODULE_PROGRESS] User has completed ${completedModules.length}/${moduleCount} modules`);
      
      // Recalculate overall course progress based on completed modules
      const allCompleted = completedModules.length === moduleCount;
      const overallProgress = Math.round((completedModules.length / moduleCount) * 100);
      
      if (userProgress) {
        // Find the correct current module index
        const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
        
        // Update user course progress with proper values
        userProgress = await storage.updateUserCourseProgress(userProgress.id, {
          progress: overallProgress,
          completed: allCompleted,
          currentModuleId: moduleId,
          currentModuleOrder: currentModuleIndex >= 0 ? currentModuleIndex + 1 : module.order
        });
        
        console.log(`[MODULE_PROGRESS] Updated course progress: ${overallProgress}%, completed: ${allCompleted}`);
      } else {
        // Create new progress entry
        userProgress = await storage.createUserCourseProgress({
          userId,
          courseId,
          currentModuleId: moduleId,
          currentModuleOrder: module.order,
          progress: overallProgress, // Use calculated progress
          completed: allCompleted
        });
        
        console.log(`[MODULE_PROGRESS] Created new course progress with ${overallProgress}%`);
      }
      
      res.json(userProgress);
    } catch (error) {
      console.error("Error updating module progress:", error);
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
  
  // Enroll in a course
  router.post("/courses/:id/enroll", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const courseId = req.params.id;
      
      console.log(`[ENROLLMENT] User ID: ${userId} attempting to enroll in Course ID: ${courseId}`);
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        console.log(`[ENROLLMENT] Course ID ${courseId} not found`);
        return res.status(404).json({ message: "Course not found" });
      }
      
      console.log(`[ENROLLMENT] Course found: ${course.title}`);
      
      // Check if already enrolled
      let existingProgress = await storage.getUserCourseProgress(userId, courseId);
      if (existingProgress) {
        console.log(`[ENROLLMENT] User ${userId} is already enrolled in course ${courseId}`);
        // Instead of returning an error, return the existing progress
        // This helps with re-enrollment attempts and fixes UI issues
        return res.status(200).json(existingProgress);
      }
      
      console.log(`[ENROLLMENT] Creating new enrollment for User ${userId} in Course ${courseId}`);
      
      // Get first module ID for the course to set as current module
      const modules = await storage.getCourseModules(courseId);
      const firstModule = modules && modules.length > 0 ? modules[0] : null;
      
      // Create new progress record
      const progressData = {
        userId,
        courseId,
        currentModuleId: firstModule ? firstModule.id : null,
        currentModuleOrder: 1,
        progress: 0,
        completed: false
      };
      
      const progress = await storage.createUserCourseProgress(progressData);
      console.log(`[ENROLLMENT] Success: ${JSON.stringify(progress)}`);
      
      res.status(201).json(progress);
    } catch (error: any) {
      console.error(`[ENROLLMENT] Error:`, error);
      res.status(500).json({ 
        message: `Failed to enroll in course: ${error?.message || 'Unknown error'}`,
        error: process.env.NODE_ENV === 'production' ? undefined : error 
      });
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
        // Return default values if no config exists
        return res.json({
          userId,
          provider: "Google AI",
          model: "gemini-1.5-flash",
          apiKey: "",
          endpoint: null,
          temperature: 0.7,
          maxTokens: 1024,
          useTranscriptions: true,
          usePdf: true,
          streaming: true
        });
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
      let apiConfig = await storage.getUserApiConfig(userId);
      
      if (!apiConfig) {
        // Create a new API config if one doesn't exist
        // Make sure temperature is a number
        const temperature = typeof req.body.temperature === 'number' 
          ? req.body.temperature 
          : req.body.temperature 
            ? Number(req.body.temperature) 
            : 0.7;
            
        apiConfig = await storage.createApiConfig({
          userId,
          provider: req.body.provider || "Google AI",
          model: req.body.model || "gemini-1.5-flash",
          apiKey: req.body.apiKey || "",
          endpoint: req.body.endpoint || null,
          temperature, // Use the correctly typed temperature
          maxTokens: req.body.maxTokens || 1024,
          useTranscriptions: req.body.useTranscriptions !== undefined ? req.body.useTranscriptions : true,
          usePdf: req.body.usePdf !== undefined ? req.body.usePdf : true,
          streaming: req.body.streaming !== undefined ? req.body.streaming : true
        });
        console.log("Created new API config for user:", userId);
        res.json(apiConfig);
      } else {
        // Update existing config
        const updatedConfig = await storage.updateUserApiConfig(userId, req.body);
        console.log("Updated API config for user:", userId);
        res.json(updatedConfig);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid API configuration", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update API configuration" });
    }
  });
}
