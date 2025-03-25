import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertQuizQuestionSchema, insertQuizResultSchema } from "@shared/schema";

export function setupQuizRoutes(router: Router, requireAuth: any, requireAdmin: any) {
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
      const { answers } = req.body;
      
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
      
      // Save the quiz result
      const quizResult = await storage.createQuizResult({
        userId,
        moduleId,
        score,
        passed,
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
        feedback
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
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz results" });
    }
  });
}
