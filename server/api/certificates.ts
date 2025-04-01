import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCertificateSchema } from "@shared/schema";

export function setupCertificateRoutes(router: Router, requireAuth: any, requireAdmin: any) {
  // Get user's certificates
  router.get("/user/certificates", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const certificates = await storage.getUserCertificates(userId);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Get a specific certificate
  router.get("/certificates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const certificate = await storage.getCertificate(req.params.id);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Only allow users to view their own certificates unless they are admin
      if (certificate.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Not authorized to view this certificate" });
      }
      
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificate" });
    }
  });

  // Get certificates for a course
  router.get("/courses/:courseId/certificates", requireAdmin, async (req: Request, res: Response) => {
    try {
      const certificates = await storage.getCertificatesByCourse(req.params.courseId);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Create a certificate (admin only or automated)
  router.post("/certificates", requireAuth, async (req: Request, res: Response) => {
    try {
      // For security, ensure the user can only create certificates for themselves unless they're an admin
      if (!req.user!.isAdmin && req.body.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to create certificates for other users" });
      }
      
      // Get user and course info
      const { userId, courseId } = req.body;
      
      // Get course progress
      const courseProgress = await storage.getUserCourseProgress(userId, courseId);
      
      // Check if all modules are completed
      const modules = await storage.getCourseModules(courseId);
      const completedModules = await storage.getCompletedModules(userId, courseId);
      
      // Only admin can bypass these checks
      if (!req.user!.isAdmin) {
        // Verify the user actually has course progress
        if (!courseProgress) {
          return res.status(400).json({ message: "You must be enrolled in the course to get a certificate" });
        }
        
        // Check if all modules are completed
        // Log completion status for debugging
        console.log(`[Certificate check] User ${userId} for course ${courseId}`);
        console.log(`[Certificate check] Modules: ${modules.length}, Completed: ${completedModules.length}`);
        
        // Get module IDs for comparison
        const courseModuleIds = modules.map(m => m.id);
        const completedModuleIds = completedModules.map(c => c.moduleId);
        
        // Check if every course module has been completed
        const allModulesCompleted = courseModuleIds.every(moduleId => 
          completedModuleIds.includes(moduleId)
        );
        
        if (!allModulesCompleted) {
          // Find which modules are missing completion
          const missingModuleIds = courseModuleIds.filter(id => !completedModuleIds.includes(id));
          console.log(`[Certificate check] Missing modules: ${missingModuleIds.join(', ')}`);
          
          return res.status(400).json({ 
            message: "Not all modules are completed",
            completed: completedModules.length,
            total: modules.length,
            missingModules: missingModuleIds
          });
        }
      }
      
      // Mark the course as completed if not already
      if (courseProgress && !courseProgress.completed) {
        await storage.updateUserCourseProgress(courseProgress.id, {
          completed: true,
          progress: 100
        });
      }
      
      // Validate and create the certificate
      const validatedData = insertCertificateSchema.parse(req.body);
      const certificate = await storage.createCertificate(validatedData);
      
      res.status(201).json(certificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid certificate data", errors: error.errors });
      }
      console.error("Certificate creation error:", error);
      res.status(500).json({ message: "Failed to create certificate" });
    }
  });

  // Delete a certificate (admin only)
  router.delete("/certificates/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const certificate = await storage.getCertificate(req.params.id);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      await storage.deleteCertificate(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete certificate" });
    }
  });
}