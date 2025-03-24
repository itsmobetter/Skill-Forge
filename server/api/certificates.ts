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
      
      // Verify that the user has completed the course
      const { userId, courseId } = req.body;
      
      const courseProgress = await storage.getUserCourseProgress(userId, courseId);
      
      // Only allow certificate creation if the course is completed (unless admin)
      if (!req.user!.isAdmin && (!courseProgress || !courseProgress.completed)) {
        return res.status(400).json({ message: "Course must be completed to issue a certificate" });
      }
      
      // Validate and create the certificate
      const validatedData = insertCertificateSchema.parse(req.body);
      const certificate = await storage.createCertificate(validatedData);
      
      res.status(201).json(certificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid certificate data", errors: error.errors });
      }
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