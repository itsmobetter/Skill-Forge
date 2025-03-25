import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { insertQuizQuestionSchema } from "@shared/schema";
import { z } from "zod";
import { createGeminiService } from "../gemini";
import { nanoid } from "nanoid";

interface QuizQuestion {
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
}

export function setupLLMRoutes(router: Router, requireAuth: any) {
  // Get user's API configuration
  router.get("/llm/config", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const apiConfig = await storage.getUserApiConfig(userId);

      if (!apiConfig) {
        // Return default config if none exists
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
      console.error("Error fetching API configuration:", error);
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });

  // Update user's API configuration
  router.patch("/llm/config", requireAuth, async (req: Request, res: Response) => {
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
        console.log("Created new API config for user in LLM API:", userId);
        res.json(apiConfig);
      } else {
        // Update existing config
        const updatedConfig = await storage.updateUserApiConfig(userId, req.body);
        console.log("Updated API config for user in LLM API:", userId);
        res.json(updatedConfig);
      }
    } catch (error) {
      console.error("Error updating API configuration:", error);
      res.status(500).json({ message: "Failed to update API configuration" });
    }
  });

  // Generate a response from the LLM
  router.post("/llm/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const apiConfig = await storage.getUserApiConfig(userId);
      if (!apiConfig) {
        return res.status(404).json({ message: "API configuration not found" });
      }

      const geminiService = createGeminiService(apiConfig);
      const response = await geminiService.generateText(prompt);

      res.json({ response });
    } catch (error) {
      console.error("Error generating LLM response:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Helper to get Gemini client with user's API key
  const getGeminiService = async (userId: number) => {
    const apiConfig = await storage.getUserApiConfig(userId);

    if (!apiConfig) {
      throw new Error("API configuration not found");
    }

    return createGeminiService(apiConfig);
  };

  // Ask a question
  router.post("/llm/question", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { courseId, question, moduleId } = req.body;

      if (!courseId || !question) {
        return res.status(400).json({ message: "Course ID and question are required" });
      }

      // Get the course info
      const course = await storage.getCourse(courseId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get module info if provided
      let module;
      if (moduleId) {
        module = await storage.getModule(moduleId);
        if (!module || module.courseId !== courseId) {
          return res.status(404).json({ message: "Module not found" });
        }
      }

      // Get course materials for context
      const materials = await storage.getCourseMaterials(courseId);

      // Get API configuration
      const apiConfig = await storage.getUserApiConfig(userId);

      if (!apiConfig) {
        return res.status(404).json({ message: "API configuration not found" });
      }

      // Get course transcriptions if enabled in API config
      let transcriptions = [];
      if (apiConfig.useTranscriptions) {
        if (moduleId) {
          // Get transcription for the specific module
          const moduleTranscription = await storage.getModuleTranscription(moduleId);
          if (moduleTranscription) {
            transcriptions.push(moduleTranscription.text);
          }
        } else {
          // Get transcriptions for all modules in the course
          const modules = await storage.getCourseModules(courseId);
          for (const mod of modules) {
            const transcript = await storage.getModuleTranscription(mod.id);
            if (transcript) {
              transcriptions.push(transcript.text);
            }
          }
        }
      }

      // Get content from PDFs if enabled
      let pdfContents: string[] = [];
      if (apiConfig.usePdf) {
        const pdfMaterials = materials.filter(m => m.type === 'pdf');
        // In a real implementation, we would extract text from PDFs here
        // For this demo, we'll use the material title and description
        pdfContents = pdfMaterials.map(m => `${m.title}: ${m.description || ''}`);
      }
      
      // Try to get relevant transcript segments from vector DB if available
      let relevantSegments: any[] = [];
      if (process.env.OPENAI_API_KEY && apiConfig.useTranscriptions) {
        try {
          // Import vector DB and search for relevant segments
          const { vectorDB } = await import('../vector-db');
          if (vectorDB.isInitialized()) {
            const segments = await vectorDB.searchTranscripts(
              question,
              moduleId,
              courseId,
              5 // Limit to 5 most relevant segments
            );
            
            if (segments && segments.length > 0) {
              relevantSegments = segments.map(segment => 
                `[${Math.floor(segment.startTime / 60)}:${(segment.startTime % 60).toString().padStart(2, '0')} - ${Math.floor(segment.endTime / 60)}:${(segment.endTime % 60).toString().padStart(2, '0')}] ${segment.text}`
              );
              console.log(`Found ${relevantSegments.length} relevant transcript segments`);
            }
          }
        } catch (vectorError) {
          console.error("Vector DB search failed:", vectorError);
          // Continue with regular transcriptions if vector search fails
        }
      }

      // Compile context
      const context = [
        `Course: ${course.title}`,
        course.description,
        module ? `Module: ${module.title}` : '',
        module?.description || '',
        relevantSegments.length > 0 ? `Relevant Transcript Segments:\n${relevantSegments.join('\n')}` : '',
        ...transcriptions,
        ...pdfContents
      ].filter(Boolean).join('\n\n');

      // Create Gemini client
      const gemini = await getGeminiService(userId);

      // Build messages for chat
      const messages = [
        {
          role: "system",
          content: `You are an expert educational assistant for a learning management system. 
          Your goal is to provide helpful, accurate, and concise answers to questions about the course content.
          Use the context provided to inform your answers, but you can also draw on your general knowledge 
          to provide comprehensive responses. Always be professional and supportive in your tone.`
        },
        {
          role: "user",
          content: question
        }
      ];

      // Call Gemini LLM
      const answer = await gemini.generateChatResponse(messages, context);

      // Save the interaction in history
      await storage.createChatInteraction({
        userId,
        courseId,
        moduleId: moduleId || null,
        question,
        answer,
        timestamp: new Date()
      });

      res.json({ answer });
    } catch (error) {
      console.error("LLM question error:", error);
      res.status(500).json({ message: "Failed to process question", error: (error as Error).message });
    }
  });

  // Generate a quiz for a module
  router.post("/llm/generate-quiz", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { courseId, moduleId, count = 5 } = req.body;

      if (!courseId || !moduleId) {
        return res.status(400).json({ message: "Course ID and module ID are required" });
      }

      // Verify user has admin rights
      if (!req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      // Get the course and module info
      const course = await storage.getCourse(courseId);
      const module = await storage.getModule(moduleId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (!module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Module not found" });
      }

      // Get module transcription
      const transcription = await storage.getModuleTranscription(moduleId);

      if (!transcription) {
        return res.status(404).json({ 
          message: "No transcription found for this module",
          details: "This module requires a valid video URL to generate a transcription. Please add a valid YouTube video URL to the module and the system will automatically generate a transcription."
        });
      }
      
      // Make sure transcription text is not empty or too short
      if (!transcription.text || transcription.text.trim().length < 50) {
        return res.status(400).json({ 
          message: "Transcription text is too short or empty",
          details: "The module has a transcription record, but the text content is insufficient to generate meaningful quiz questions. Please ensure the video has proper audio content that can be transcribed."
        });
      }

      // Create Gemini client
      const gemini = await getGeminiService(userId);

      // System instruction for quiz generation
      const systemInstruction = `You are an expert quiz generator for educational content. 
      Your task is to create multiple-choice quiz questions based on the provided course module content.
      For each question, generate 4 options with exactly one correct answer.
      Format your response as a valid JSON array of questions with the following structure:
      [
        {
          "text": "Question text",
          "options": [
            {"id": "A", "text": "Option A"},
            {"id": "B", "text": "Option B"},
            {"id": "C", "text": "Option C"},
            {"id": "D", "text": "Option D"}
          ],
          "correctOptionId": "B" // The ID of the correct option
        }
      ]`;

      // Prompt for quiz generation
      const prompt = `Generate ${count} multiple-choice quiz questions for the following module content:

      Course: ${course.title}
      Module: ${module.title}

      Content:
      ${transcription.text}`;

      try {
        // Generate quiz questions using our new generateQuizQuestions method
        const generatedQuestions = await gemini.generateQuizQuestions(transcription.text, count);

        // Validate the structure of generated questions
        if (!Array.isArray(generatedQuestions)) {
          throw new Error("Generated content is not an array");
        }

        // Save the generated questions
        const savedQuestions = [];

        for (const question of generatedQuestions) {
          // Validate question format
          if (!question.text || !Array.isArray(question.options) || !question.correctOptionId) {
            continue;
          }

          try {
            const validatedQuestion = insertQuizQuestionSchema.parse({
              moduleId,
              text: question.text,
              options: question.options,
              correctOptionId: question.correctOptionId
            });

            const savedQuestion = await storage.createQuizQuestion(validatedQuestion);
            savedQuestions.push(savedQuestion);
          } catch (validationError) {
            console.error("Quiz question validation error:", validationError);
            // Skip invalid questions
          }
        }

        // Update module to indicate it has a quiz
        await storage.updateModule(moduleId, { hasQuiz: true });

        res.json({ questions: savedQuestions, count: savedQuestions.length });
      } catch (parseError) {
        console.error("Quiz generation parse error:", parseError);
        res.status(500).json({ message: "Failed to parse generated quiz questions" });
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ message: "Failed to generate quiz", error: (error as Error).message });
    }
  });

  // Transcribe a video
  router.post("/llm/transcribe", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { videoUrl, moduleId } = req.body;

      if (!videoUrl) {
        return res.status(400).json({ message: "Video URL is required" });
      }

      // Verify user has admin rights if trying to save to a module
      if (moduleId && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin privileges required to save transcriptions" });
      }

      // Get video ID from YouTube URL
      const videoIdMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (!videoId) {
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      // For a real implementation, we would use the YouTube API or a transcription service
      // Here we'll use Gemini to generate a simulated transcription

      // Create Gemini client
      const gemini = await getGeminiService(userId);

      // Generate a timestamped transcription for better AI referencing
      const { transcript, segments } = await gemini.generateTimestampedTranscript(videoId);
      
      // If a module ID is provided, save the transcription and process segments for vector DB
      if (moduleId && transcript) {
        try {
          // Check if module exists
          const module = await storage.getModule(moduleId);
          if (!module) {
            return res.status(404).json({ message: "Module not found" });
          }
          
          // Get course ID for the module for context
          const moduleWithCourse = await storage.getCourseModules(module.courseId);
          const courseId = module.courseId;
          
          // Prepare segments for vector storage
          const vectorSegments = segments.map((segment: any) => ({
            id: nanoid(8),
            moduleId,
            courseId,
            text: segment.text,
            startTime: segment.startTime,
            endTime: segment.endTime
          }));
          
          // Add to vector DB if Gemini API key is available
          let vectorId = null;
          if (process.env.GEMINI_API_KEY) {
            try {
              // Import vector DB and add segments
              const { vectorDB } = await import('../vector-db');
              vectorId = await vectorDB.addTranscriptSegments(vectorSegments, videoId);
            } catch (vectorError) {
              console.error("Vector DB storage failed:", vectorError);
              // Continue even if vector storage fails
            }
          }
          
          // Save or update the transcription in the main database
          const existingTranscription = await storage.getModuleTranscription(moduleId);

          if (existingTranscription) {
            await storage.updateModuleTranscription(existingTranscription.id, { 
              text: transcript,
              timestampedText: segments,
              vectorId: vectorId || existingTranscription.vectorId
            });
          } else {
            await storage.createModuleTranscription({
              moduleId,
              videoId,
              text: transcript,
              timestampedText: segments,
              vectorId
            });
          }

          // Update module with the video URL if it's not already set
          if (!module.videoUrl) {
            await storage.updateModule(moduleId, { videoUrl });
          }
        } catch (error) {
          console.error("Error processing transcription:", error);
          // Continue to return the transcript even if storage fails
        }
      }

      res.json({
        transcription: transcript,
        segments,
        videoId,
        savedToModule: moduleId ? true : false
      });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ message: "Failed to generate transcription", error: (error as Error).message });
    }
  });
}