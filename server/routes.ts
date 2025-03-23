import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupCoursesRoutes } from "./api/courses";
import { setupQuizRoutes } from "./api/quiz";
import { setupLLMRoutes } from "./api/llm";
import { storage } from "./storage";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  const { requireAuth, requireAdmin } = setupAuth(app);

  // Create API router
  const apiRouter = express.Router();

  // Register API routes
  setupCoursesRoutes(apiRouter, requireAuth, requireAdmin);
  setupQuizRoutes(apiRouter, requireAuth, requireAdmin);
  setupLLMRoutes(apiRouter, requireAuth);

  // Mount API router
  app.use("/api", apiRouter);

  // Seed initial data if database is empty
  await seedInitialData();

  const httpServer = createServer(app);
  return httpServer;
}

// Function to seed initial data
async function seedInitialData() {
  try {
    // Check if we already have users
    const users = await storage.getAllUsers();
    
    if (users.length === 0) {
      // Create admin user
      const adminUser = await storage.createUser({
        username: "admin",
        password: "admin123", // In a real app, this would be hashed
        isAdmin: true
      });

      // Create admin profile
      await storage.createUserProfile({
        userId: adminUser.id,
        firstName: "Admin",
        lastName: "User",
        email: "admin@skillforge.com",
        position: "System Administrator",
        department: "IT",
        about: "System administrator for Skill Forge LMS",
        avatarUrl: ""
      });

      // Create API config for admin
      await storage.createApiConfig({
        userId: adminUser.id,
        provider: "Google",
        model: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY || "",
        endpoint: "",
        temperature: 0.7,
        maxTokens: 1024,
        useTranscriptions: true,
        usePdf: true,
        streaming: true
      });

      // Create sample courses
      const iso9001Course = await storage.createCourse({
        title: "ISO 9001 Quality Management Systems",
        description: "Learn the essentials of ISO 9001 quality management systems and certification requirements.",
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        tag: "Popular",
        tagColor: "secondary",
        rating: 4.8,
        reviewCount: 128,
        duration: "6 hours"
      });

      const spcCourse = await storage.createCourse({
        title: "Statistical Process Control (SPC)",
        description: "Master statistical methods for monitoring and controlling quality during production.",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        tag: "New",
        tagColor: "primary",
        rating: 4.6,
        reviewCount: 94,
        duration: "8 hours"
      });

      const cpCpkCourse = await storage.createCourse({
        title: "Process Capability (Cp & Cpk)",
        description: "Understand how to calculate and interpret process capability indices.",
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        tag: "Beginner",
        tagColor: "green",
        rating: 4.9,
        reviewCount: 156,
        duration: "4 hours"
      });

      // Create modules for ISO 9001 course
      const module1 = await storage.createModule({
        courseId: iso9001Course.id,
        title: "Introduction to ISO 9001",
        description: "This module introduces the ISO 9001 quality management system standard, its history, purpose, and key principles.",
        order: 1,
        videoUrl: "https://www.youtube.com/watch?v=I9QGnNvrmoY",
        duration: "18 minutes",
        completed: false,
        hasQuiz: true,
        tags: ["ISO Standards", "Quality Management", "Certification", "Process Approach"],
        objectives: [
          "Understand the purpose and benefits of ISO 9001",
          "Identify the seven quality management principles",
          "Explain the process approach to quality management",
          "Recognize the structure of the ISO 9001 standard",
          "Describe the certification process"
        ]
      });

      await storage.createModule({
        courseId: iso9001Course.id,
        title: "Quality Management Principles",
        description: "Explore the seven quality management principles that form the foundation of ISO 9001.",
        order: 2,
        videoUrl: "https://www.youtube.com/watch?v=9cKsq14Kfsw",
        duration: "24 minutes",
        completed: false,
        hasQuiz: true,
        tags: ["Quality Principles", "Customer Focus", "Leadership", "Process Approach"],
        objectives: [
          "Understand each of the seven quality management principles",
          "Apply principles to organizational context",
          "Identify key performance indicators for each principle",
          "Develop strategies for implementing principles"
        ]
      });

      // Add materials to ISO 9001 course
      await storage.createMaterial({
        courseId: iso9001Course.id,
        title: "ISO 9001:2015 Overview",
        description: "Comprehensive overview of the ISO 9001:2015 standard requirements",
        type: "pdf",
        url: "https://example.com/iso-9001-overview.pdf",
        fileSize: "2.4 MB"
      });

      await storage.createMaterial({
        courseId: iso9001Course.id,
        title: "ISO 9001 Implementation Checklist",
        description: "Step-by-step checklist for implementing ISO 9001 in your organization",
        type: "spreadsheet",
        url: "https://example.com/iso-9001-checklist.xlsx",
        fileSize: "450 KB"
      });

      await storage.createMaterial({
        courseId: iso9001Course.id,
        title: "Quality Management System Template",
        description: "Template document for creating your organization's quality management system",
        type: "document",
        url: "https://example.com/qms-template.docx",
        fileSize: "890 KB"
      });

      // Create quiz questions for module 1
      await storage.createQuizQuestion({
        moduleId: module1.id,
        text: "What is the primary purpose of ISO 9001?",
        options: [
          { id: "A", text: "To ensure product quality only" },
          { id: "B", text: "To provide a framework for quality management systems" },
          { id: "C", text: "To regulate manufacturing industries" },
          { id: "D", text: "To enforce specific documentation requirements" }
        ],
        correctOptionId: "B"
      });

      await storage.createQuizQuestion({
        moduleId: module1.id,
        text: "Which of the following is NOT one of the seven quality management principles?",
        options: [
          { id: "A", text: "Customer focus" },
          { id: "B", text: "Leadership" },
          { id: "C", text: "Financial management" },
          { id: "D", text: "Engagement of people" }
        ],
        correctOptionId: "C"
      });

      // Create user course progress for admin
      await storage.createUserCourseProgress({
        userId: adminUser.id,
        courseId: iso9001Course.id,
        currentModuleId: module1.id,
        currentModuleOrder: 1,
        progress: 65,
        completed: false
      });

      // Create a regular user
      const regularUser = await storage.createUser({
        username: "user",
        password: "user123", // In a real app, this would be hashed
        isAdmin: false
      });

      // Create regular user profile
      await storage.createUserProfile({
        userId: regularUser.id,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        position: "Quality Assurance Manager",
        department: "Quality Assurance",
        about: "Quality professional with 8+ years of experience implementing quality management systems across manufacturing environments.",
        avatarUrl: ""
      });

      // Create API config for regular user
      await storage.createApiConfig({
        userId: regularUser.id,
        provider: "Google",
        model: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY || "",
        endpoint: "",
        temperature: 0.7,
        maxTokens: 1024,
        useTranscriptions: true,
        usePdf: true,
        streaming: true
      });

      console.log("Initial data seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}
