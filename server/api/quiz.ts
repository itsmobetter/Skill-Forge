import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertQuizQuestionSchema, insertQuizResultSchema } from "@shared/schema";
import { executeQuery } from "../db";

export function setupQuizRoutes(router: Router, requireAuth: any, requireAdmin: any) {
  // Debug endpoint to check quiz results structure
  router.get("/quiz-debug", requireAuth, async (req: Request, res: Response) => {
    try {
      // Find any quiz results for the current user
      const userId = req.user!.id;
      
      // Use the storage interface rather than direct query
      const results = await storage.getQuizResults(userId, "any"); // "any" is a placeholder, we'll get all results
      
      res.json({
        message: "Quiz results debug info",
        userId,
        resultsCount: results.length,
        results: results.map(r => ({
          id: r.id,
          score: r.score,
          passed: r.passed,
          completedAt: r.completedAt,
          timeSpentSeconds: r.timeSpentSeconds,
          hasQuestions: Array.isArray(r.questions) ? r.questions.length : 0,
          hasAnswers: Array.isArray(r.answers) ? r.answers.length : 0,
          // Show a sample of the actual data structure
          sampleQuestion: Array.isArray(r.questions) && r.questions.length > 0 ? r.questions[0] : null,
          sampleAnswer: Array.isArray(r.answers) && r.answers.length > 0 ? r.answers[0] : null
        }))
      });
    } catch (error) {
      console.error('Quiz debug error:', error);
      res.status(500).json({ message: "Failed to fetch quiz debug info", error: (error as Error).message });
    }
  });
  // Get quiz questions for a module
  router.get("/courses/:courseId/modules/:moduleId/quiz", requireAuth, async (req: Request, res: Response) => {
    try {
      const { courseId, moduleId } = req.params;
      
      // Verify the course and module exist
      const course = await storage.getCourse(courseId);
      const module = await storage.getModule(moduleId);
      
      if (!course || !module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Course or module not found" });
      }
      
      // Get quiz questions
      const questions = await storage.getQuizQuestions(moduleId);
      
      // Don't return the correct answer to the client
      const sanitizedQuestions = questions.map(({ correctOptionId, ...rest }) => rest);
      
      res.json(sanitizedQuestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  // Submit quiz answers
  router.post("/courses/:courseId/modules/:moduleId/quiz/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { courseId, moduleId } = req.params;
      const { answers, timeSpentSeconds } = req.body;
      
      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: "Invalid answers format" });
      }
      
      // Verify the course and module exist
      const course = await storage.getCourse(courseId);
      const module = await storage.getModule(moduleId);
      
      if (!course || !module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Course or module not found" });
      }
      
      // Get quiz questions with correct answers
      const questions = await storage.getQuizQuestions(moduleId);
      
      if (questions.length === 0) {
        return res.status(404).json({ message: "No quiz questions found for this module" });
      }
      
      // Evaluate the answers
      let correct = 0;
      const feedback: Record<string, boolean> = {};
      
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        
        if (question) {
          const isCorrect = question.correctOptionId === answer.answerId;
          feedback[answer.questionId] = isCorrect;
          
          if (isCorrect) {
            correct++;
          }
        }
      }
      
      const total = questions.length;
      const score = (correct / total) * 100;
      const passed = score >= 80; // 80% passing threshold (requirement for employee competency assessment)
      
      // Prepare answers data for storage
      const answersData = answers.map(answer => ({
        questionId: answer.questionId,
        selectedOptionId: answer.answerId
      }));
      
      // Save the quiz result with questions, answers, and time spent
      const quizResult = await storage.createQuizResult({
        userId,
        moduleId,
        score,
        passed,
        timeSpentSeconds: timeSpentSeconds || 0,
        questions: questions,
        answers: answersData,
        completedAt: new Date()
      });
      
      // If passed, mark the module as completed
      if (passed) {
        await storage.updateModuleCompletion(userId, moduleId, true);
        
        // Update course progress
        const userProgress = await storage.getUserCourseProgress(userId, courseId);
        
        if (userProgress) {
          // Get all modules for this course
          const modules = await storage.getCourseModules(courseId);
          
          // Find the next module
          const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
          const nextModuleIndex = currentModuleIndex + 1;
          
          if (nextModuleIndex < modules.length) {
            // Move to the next module
            const nextModule = modules[nextModuleIndex];
            await storage.updateUserCourseProgress(userProgress.id, {
              currentModuleId: nextModule.id,
              currentModuleOrder: nextModule.order
            });
          }
          
          // Check if all modules are completed
          const completedModules = await storage.getCompletedModules(userId, courseId);
          if (completedModules.length === modules.length) {
            await storage.updateUserCourseProgress(userProgress.id, {
              completed: true
            });
          }
        }
      }
      
      res.json({
        correct,
        total,
        score,
        passed,
        feedback,
        timeSpentSeconds
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit quiz answers" });
    }
  });

  // Create quiz questions (admin only)
  router.post("/courses/:courseId/modules/:moduleId/quiz/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { courseId, moduleId } = req.params;
      const { questions } = req.body;
      
      if (!Array.isArray(questions)) {
        return res.status(400).json({ message: "Questions must be an array" });
      }
      
      // Verify the course and module exist
      const course = await storage.getCourse(courseId);
      const module = await storage.getModule(moduleId);
      
      if (!course || !module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Course or module not found" });
      }
      
      // Validate and create each question
      const createdQuestions = [];
      
      for (const questionData of questions) {
        const validatedData = insertQuizQuestionSchema.parse({
          ...questionData,
          moduleId
        });
        
        const question = await storage.createQuizQuestion(validatedData);
        createdQuestions.push(question);
      }
      
      // Update module to indicate it has a quiz
      await storage.updateModule(moduleId, { hasQuiz: true });
      
      res.status(201).json(createdQuestions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quiz questions" });
    }
  });

  // Get quiz results for a user and module
  router.get("/courses/:courseId/modules/:moduleId/quiz/results", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { moduleId } = req.params;
      
      const results = await storage.getQuizResults(userId, moduleId);
      
      // Log the quiz results to check what data is available
      console.log('Quiz results data:', JSON.stringify(results).substring(0, 200) + '...');
      
      // Make sure the results are being returned with the questions and answers data
      // The PostgreSQL jsonb fields should be parsed automatically by drizzle-orm
      res.json(results);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      res.status(500).json({ message: "Failed to fetch quiz results" });
    }
  });
  
  // Get quiz questions for history view (with answer info for completed quizzes)
  router.get("/courses/:courseId/modules/:moduleId/quiz/questions", requireAuth, async (req: Request, res: Response) => {
    try {
      const { courseId, moduleId } = req.params;
      
      // Verify the course and module exist
      const course = await storage.getCourse(courseId);
      const module = await storage.getModule(moduleId);
      
      if (!course || !module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Course or module not found" });
      }
      
      // Get quiz questions with all information including correct answers
      // This is safe because it's only used for viewing history after completion
      const questions = await storage.getQuizQuestions(moduleId);
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz questions with answers" });
    }
  });
  
  // Regenerate quiz questions for a module
  router.post("/courses/:courseId/modules/:moduleId/quiz/regenerate", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { courseId, moduleId } = req.params;
      
      // Verify the course and module exist
      const course = await storage.getCourse(courseId);
      const module = await storage.getModule(moduleId);
      
      if (!course || !module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Course or module not found" });
      }
      
      console.log(`[QUIZ_REGENERATE] User ${userId} requested quiz regeneration for module ${moduleId}`);
      
      // First, delete all existing questions to ensure we start fresh
      try {
        const existingQuestions = await storage.getQuizQuestions(moduleId);
        console.log(`[QUIZ_REGENERATE] Found ${existingQuestions.length} existing questions to delete`);
        
        if (existingQuestions.length > 0) {
          // Use direct database deletion for reliability
          console.log(`[QUIZ_REGENERATE] Using direct database query to delete all questions`);
          await db.delete(schema.quizQuestions).where(eq(schema.quizQuestions.moduleId, moduleId));
          
          // Verify deletion worked
          const remainingQuestions = await storage.getQuizQuestions(moduleId);
          console.log(`[QUIZ_REGENERATE] After deletion: ${remainingQuestions.length} questions remain`);
          
          if (remainingQuestions.length > 0) {
            console.log(`[QUIZ_REGENERATE] Some questions remain, trying raw SQL query`);
            await db.execute(sql`DELETE FROM quiz_questions WHERE module_id = ${moduleId}`);
            console.log(`[QUIZ_REGENERATE] Executed raw SQL deletion`);
            
            // Final check
            const finalCheck = await storage.getQuizQuestions(moduleId);
            console.log(`[QUIZ_REGENERATE] Final verification: ${finalCheck.length} questions remain`);
          }
        }
      } catch (deleteError) {
        console.error(`[QUIZ_REGENERATE] Error deleting existing questions:`, deleteError);
        // Try one more approach with raw SQL
        try {
          console.log(`[QUIZ_REGENERATE] Attempting emergency raw SQL deletion`);
          await db.execute(sql`DELETE FROM quiz_questions WHERE module_id = ${moduleId}`);
        } catch (sqlError) {
          console.error(`[QUIZ_REGENERATE] Emergency SQL deletion also failed:`, sqlError);
        }
      }
      
      // Generate a unique request ID
      const requestId = Math.random().toString(36).substring(2, 15);
      
      // First, explicitly delete all existing quiz questions for this module
      console.log(`[QUIZ REGEN ${Date.now()}] Step 1: Explicitly deleting all existing questions for module ${moduleId}`);
      try {
        const { db, sql } = require('../db');
        
        // Direct database delete for reliability
        await db.execute(sql`DELETE FROM quiz_questions WHERE module_id = ${moduleId}`);
        console.log(`[QUIZ REGEN ${Date.now()}] Successfully deleted all questions for module ${moduleId} using direct SQL`);
      } catch (deleteError) {
        console.error(`[QUIZ REGEN ${Date.now()}] Error deleting questions with direct SQL:`, deleteError);
        
        // Fallback to using storage API
        try {
          const storage = require('../storage').storage;
          const existingQuestions = await storage.getQuizQuestions(moduleId);
          console.log(`[QUIZ REGEN ${Date.now()}] Found ${existingQuestions.length} questions to delete via API`);
          
          for (const question of existingQuestions) {
            await storage.deleteQuizQuestion(question.id);
            console.log(`[QUIZ REGEN ${Date.now()}] Deleted question ${question.id}`);
          }
        } catch (storageError) {
          console.error(`[QUIZ REGEN ${Date.now()}] Error with fallback deletion:`, storageError);
        }
      }
      
      // Now make the internal request to generate new questions
      console.log(`[QUIZ REGEN ${Date.now()}] Step 2: Generating new questions for module ${moduleId}`);
      const uniqueTimestamp = Date.now();
      const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/llm/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Request': 'true',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({
          courseId,
          moduleId,
          count: 5,  // Default to 5 questions
          internal: true,
          forceRegenerate: true,  // Signal that this is a regeneration request
          archiveOld: true,       // Explicit signal to archive old questions
          requestId: `${requestId}-${uniqueTimestamp}`,  // Add unique ID to ensure this is treated as a new request
          timestamp: uniqueTimestamp,  // Add timestamp to prevent caching
          bypassCache: Math.random()   // Additional randomness to bypass caching
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("Quiz regeneration error:", error);

  // Direct database reset endpoint for quiz questions
  router.post("/courses/:courseId/modules/:moduleId/quiz/reset-database", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { moduleId } = req.params;
      const timestamp = Date.now();
      
      console.log(`[QUIZ DB RESET ${timestamp}] User ${userId} requested direct database reset for module ${moduleId}`);
      
      try {
        // First try to use the provided database functions
        const { db, sql } = require('../db');
        
        // Direct SQL approach with explicit error handling
        console.log(`[QUIZ DB RESET ${timestamp}] Executing direct DELETE SQL command`);
        try {
          // Execute raw DELETE SQL
          await db.execute(sql`DELETE FROM quiz_questions WHERE module_id = ${moduleId}`);
          console.log(`[QUIZ DB RESET ${timestamp}] DELETE SQL command executed successfully`);
          
          // Double-check that deletion worked
          const remainingQuestions = await storage.getQuizQuestions(moduleId);
          console.log(`[QUIZ DB RESET ${timestamp}] After deletion: ${remainingQuestions.length} questions remain`);
          
          return res.json({ 
            success: true, 
            message: `Quiz questions deleted successfully. Remaining: ${remainingQuestions.length}`,
            timestamp
          });
        } catch (sqlError) {
          console.error(`[QUIZ DB RESET ${timestamp}] SQL error:`, sqlError);
          return res.status(500).json({ 
            success: false, 
            message: "SQL error occurred during reset", 
            error: sqlError.message
          });
        }
      } catch (error) {
        console.error(`[QUIZ DB RESET ${timestamp}] Server error:`, error);
        return res.status(500).json({ 
          success: false, 
          message: "Server error during reset", 
          error: error.message
        });
      }
    } catch (error) {
      console.error("Reset database error:", error);
      res.status(500).json({ 
        message: "Failed to reset quiz database", 
        error: (error as Error).message 
      });
    }
  });

      res.status(500).json({ message: "Failed to regenerate quiz questions", error: (error as Error).message });
    }
  });
}
