import { Router } from "express";
import { storage } from "../storage";
import { insertSOPSchema } from "@shared/schema";
import { z } from "zod";

export function setupSOPRoutes(
  router: Router,
  requireAuth: any,
  requireAdmin: any
) {
  // Get all SOPs - Admin only
  router.get("/sop", requireAuth, requireAdmin, async (req, res) => {
    try {
      const sops = await storage.getAllSOPs();
      return res.status(200).json(sops);
    } catch (error) {
      console.error("[API] Error fetching SOPs:", error);
      return res.status(500).json({ error: "Failed to fetch standard operating procedures" });
    }
  });

  // Get a specific SOP by ID
  router.get("/sop/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const sop = await storage.getSOP(id);
      
      if (!sop) {
        return res.status(404).json({ error: "Standard operating procedure not found" });
      }
      
      return res.status(200).json(sop);
    } catch (error) {
      console.error(`[API] Error fetching SOP with ID ${req.params.id}:`, error);
      return res.status(500).json({ error: "Failed to fetch standard operating procedure" });
    }
  });

  // Create a new SOP - Admin only
  router.post("/sop", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Validate the request body using the insertSOPSchema
      const validatedData = insertSOPSchema.parse(req.body);
      
      // Add the user ID as the creator if not provided
      if (!validatedData.createdBy && req.user) {
        validatedData.createdBy = req.user.id;
      }
      
      // Create the SOP
      const newSOP = await storage.createSOP(validatedData);
      
      return res.status(201).json(newSOP);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid SOP data", 
          details: error.errors 
        });
      }
      
      console.error("[API] Error creating SOP:", error);
      return res.status(500).json({ error: "Failed to create standard operating procedure" });
    }
  });

  // Update an existing SOP - Admin only
  router.patch("/sop/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // First check if the SOP exists
      const existingSOP = await storage.getSOP(id);
      if (!existingSOP) {
        return res.status(404).json({ error: "Standard operating procedure not found" });
      }
      
      // Update the SOP
      const updatedSOP = await storage.updateSOP(id, req.body);
      
      return res.status(200).json(updatedSOP);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid SOP data", 
          details: error.errors 
        });
      }
      
      console.error(`[API] Error updating SOP with ID ${req.params.id}:`, error);
      return res.status(500).json({ error: "Failed to update standard operating procedure" });
    }
  });
}