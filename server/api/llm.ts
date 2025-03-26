import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { insertQuizQuestionSchema, ModuleTranscription } from "@shared/schema";
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
  router.post("/llm/generate-quiz", async (req: Request, res: Response) => {
    try {
      // Handle both authenticated users and internal system calls
      let userId: number;
      const { courseId, moduleId, count = 5, numQuestions, content, internal, forceRegenerate } = req.body;
      const finalQuestionCount = numQuestions || count || 5;
      
      // For internal automated quiz generation calls
      const isInternalRequest = 
        internal === true || 
        req.headers['x-internal-request'] === 'true';
        
      if (isInternalRequest) {
        // Use admin user ID for internal requests
        const adminUser = await storage.getUserByUsername('syafiqazrin');
        userId = adminUser?.id || 6; // Fallback to default admin ID if not found
        console.log(`[AUTO_QUIZ] Processing internal automated quiz generation request for module ${moduleId}`);
      } else if (req.user) {
        // Normal authenticated user
        userId = req.user.id;
        
        // Verify user has admin rights
        if (!req.user.isAdmin) {
          return res.status(403).json({ message: "Admin privileges required" });
        }
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!moduleId) {
        return res.status(400).json({ message: "Module ID is required" });
      }

      // Get the module info first
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // If courseId wasn't provided, get it from the module
      const effectiveCourseId = courseId || module.courseId;
      
      // Now get the course info
      const course = await storage.getCourse(effectiveCourseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Initialize course and module information with defaults
      let courseTitle = "Unknown Course";
      let moduleTitle = "Unknown Module";
      
      // Update with primary course and module data when available
      if (course && course.title) {
        courseTitle = course.title;
      }
      
      if (module && module.title) {
        moduleTitle = module.title;
      }
      
      // Get content for quiz generation - from multiple possible sources
      let quizContent: string;
      
      // 1. If content is provided directly in the request body, use that first
      if (content && typeof content === 'string' && content.trim().length > 100) {
        console.log(`[AUTO_QUIZ] Using provided content for quiz generation (${content.length} characters)`);
        quizContent = content;
      } else {
        // 2. Try to get the module transcription
        const transcription = await storage.getModuleTranscription(moduleId);

        // Check if we have a valid transcription with sufficient content
        if (transcription && transcription.text && transcription.text.trim().length >= 50) {
          console.log(`[AUTO_QUIZ] Using existing module transcription (${transcription.text.length} characters)`);
          quizContent = transcription.text;
        } else {
          // 3. If no transcription, generate content based on module and course information
          console.log(`[AUTO_QUIZ] No valid transcription found, using module/course metadata to generate content`);
          
          // Build a rich context from module and course data
          const moduleDescription = module.description || ""; 
          const courseDescription = course.description || "";
          const moduleTags = module.tags ? JSON.stringify(module.tags) : "";
          const moduleObjectives = module.objectives ? JSON.stringify(module.objectives) : "";
          
          // For modules without transcriptions, use metadata and module description to generate quiz content
          const contextInfo = `
            Module Title: ${moduleTitle}
            Module Description: ${moduleDescription}
            Course Title: ${courseTitle}
            Course Description: ${courseDescription}
            Module Tags: ${moduleTags}
            Module Objectives: ${moduleObjectives}
          `.trim();
          
          // Check if we have enough context data
          if (contextInfo.length < 100) {
            console.log(`[AUTO_QUIZ] Warning: Limited context information available for quiz generation`);
            // Still proceed but with a generic topic based on the module title
            quizContent = `Generate quality management quiz questions about "${moduleTitle}" in the context of "${courseTitle}". Focus on best practices, standards, and implementation details for quality management systems in engineering contexts. Include questions about measurement, standards compliance, and process improvement.`;
          } else {
            quizContent = `Generate quality management quiz questions based on this educational content: ${contextInfo}`;
          }
          
          console.log(`[AUTO_QUIZ] Generated synthetic content for quiz generation (${quizContent.length} characters)`);
        }
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
      
      const prompt = `Generate ${finalQuestionCount} multiple-choice quiz questions for the following module content:

      Course: ${courseTitle}
      Module: ${moduleTitle}

      Content:
      ${quizContent}`;

      try {
        // Generate quiz questions with the formatted content
        console.log(`[AUTO_QUIZ] Generating ${finalQuestionCount} questions for module ${moduleId}`);
        console.log(`[AUTO_QUIZ] Using course: ${courseTitle}, module: ${moduleTitle}`);
        console.log(`[AUTO_QUIZ] Content length: ${quizContent.length} characters`);
        
        // Check if we should regenerate quiz questions or if there are already existing ones
        const existingQuestions = await storage.getQuizQuestions(moduleId);
        
        if (existingQuestions.length > 0 && !forceRegenerate) {
          console.log(`[AUTO_QUIZ] Module ${moduleId} already has ${existingQuestions.length} questions and forceRegenerate is not set. Skipping generation.`);
          return res.json({ 
            success: true,
            questionsExisted: true,
            questionsCount: existingQuestions.length,
            module: { id: moduleId, title: moduleTitle },
            course: { id: effectiveCourseId, title: courseTitle }
          });
        }
        
        // When regenerating, add a hint to ensure different questions 
        const promptPrefix = forceRegenerate 
          ? "Please generate completely new and different questions than before. " 
          : "";
            
        const promptWithPrefix = promptPrefix + quizContent;
        console.log(`[AUTO_QUIZ] ${forceRegenerate ? 'Regenerating' : 'Generating'} quiz with ${finalQuestionCount} questions`);
        
        const generatedQuestions = await gemini.generateQuizQuestions(promptWithPrefix, finalQuestionCount);

        // Validate the structure of generated questions
        if (!generatedQuestions) {
          console.error("[AUTO_QUIZ] No questions were generated by the model");
          throw new Error("Failed to generate any quiz questions");
        }
        
        if (!Array.isArray(generatedQuestions)) {
          console.error("[AUTO_QUIZ] Generated content is not an array:", typeof generatedQuestions);
          throw new Error("Generated content is not an array");
        }
        
        console.log(`[AUTO_QUIZ] Successfully generated ${generatedQuestions.length} questions`);

        // Save the generated questions
        const savedQuestions = [];

        for (const question of generatedQuestions) {
          // Validate question format and log any issues
          if (!question.text) {
            console.error("[AUTO_QUIZ] Skipping question without text");
            continue;
          }
          
          if (!Array.isArray(question.options)) {
            console.error("[AUTO_QUIZ] Skipping question without valid options array:", question.text);
            continue;
          }
          
          if (!question.correctOptionId) {
            console.error("[AUTO_QUIZ] Skipping question without correctOptionId:", question.text);
            continue;
          }
          
          // Check if correctOptionId exists in options
          const correctOption = question.options.find((opt: {id: string; text: string}) => opt.id === question.correctOptionId);
          if (!correctOption) {
            console.error(`[AUTO_QUIZ] Skipping question with invalid correctOptionId: ${question.correctOptionId} not found in options`);
            continue;
          }
          
          // Check that we have 4 options as required
          if (question.options.length !== 4) {
            console.error(`[AUTO_QUIZ] Skipping question with ${question.options.length} options (expected 4)`);
            continue;
          }

          try {
            // Create the question object to validate
            const questionData = {
              moduleId,
              text: question.text,
              options: question.options,
              correctOptionId: question.correctOptionId
            };
            
            try {
              // First try to validate using Zod schema
              const validatedQuestion = insertQuizQuestionSchema.parse(questionData);
              
              // If validation passes, save to database
              const savedQuestion = await storage.createQuizQuestion(validatedQuestion);
              savedQuestions.push(savedQuestion);
              console.log(`[AUTO_QUIZ] Successfully saved question: "${question.text.substring(0, 50)}..."`);
            } catch (validationError) {
              // Log detailed validation error for debugging
              console.error("[AUTO_QUIZ] Quiz question validation error:");
              console.error(`- Question text: "${question.text.substring(0, 100)}..."`);
              console.error(`- Options count: ${question.options.length}`);
              console.error(`- CorrectOptionId: ${question.correctOptionId}`);
              console.error(`- Error details: ${JSON.stringify(validationError)}`);
              // Skip invalid questions
            }
          } catch (dbError) {
            // This is a database or other error (not validation)
            console.error("[AUTO_QUIZ] Error saving question to database:", dbError);
            // Skip questions that can't be saved
          }
        }

        // Only mark module as having a quiz if we actually saved questions
        if (savedQuestions.length > 0) {
          try {
            await storage.updateModule(moduleId, { hasQuiz: true });
            console.log(`[AUTO_QUIZ] Successfully saved ${savedQuestions.length} questions for module ${moduleId}`);
          } catch (updateError) {
            console.error("[AUTO_QUIZ] Error updating module with hasQuiz=true:", updateError);
            // Continue as we still want to return the saved questions
          }
          
          res.json({ 
            success: true, 
            questions: savedQuestions, 
            count: savedQuestions.length 
          });
        } else {
          // If no questions were saved, return a more specific error
          console.error("[AUTO_QUIZ] No valid questions were saved for module", moduleId);
          res.status(500).json({ 
            success: false,
            message: "Failed to save any valid quiz questions", 
            details: "The system generated quiz questions but none of them passed validation. Please try again."
          });
        }
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
  router.post("/llm/transcribe", async (req: Request, res: Response) => {
    try {
      // Handle both authenticated users and internal system calls
      let userId: number;
      const { videoUrl, moduleId, internal } = req.body;
      
      // For internal automated transcription calls
      const isInternalRequest = 
        internal === true || 
        req.headers['x-internal-request'] === 'true';
        
      if (isInternalRequest) {
        // Use admin user ID for internal requests
        const adminUser = await storage.getUserByUsername('syafiqazrin');
        userId = adminUser?.id || 6; // Fallback to default admin ID if not found
        console.log(`[TRANSCRIPTION] Processing internal automated transcription request for module ${moduleId}`);
      } else if (req.user) {
        // Normal authenticated user
        userId = req.user.id;
        
        // Verify user has admin rights if trying to save to a module
        if (moduleId && !req.user.isAdmin) {
          return res.status(403).json({ message: "Admin privileges required to save transcriptions" });
        }
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!videoUrl) {
        return res.status(400).json({ message: "Video URL is required" });
      }

      // Try to get video ID from YouTube URL
      const videoIdMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      
      // Use the YouTube ID if available, otherwise use the URL or a reference identifier
      let videoId;
      
      if (videoIdMatch && videoIdMatch[1]) {
        videoId = videoIdMatch[1];
        console.log(`[TRANSCRIPTION] Extracted YouTube ID: ${videoId}`);
      } else {
        // For non-YouTube videos, create a reference ID from the URL or use a provided moduleId
        videoId = moduleId || videoUrl.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
        console.log(`[TRANSCRIPTION] Using reference ID for non-YouTube video: ${videoId}`);
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

          try {
            if (existingTranscription) {
              // Create an update object with basic fields only
              const updateData: any = { 
                text: transcript,
                videoId
              };
              
              // We'll store the segments in vector database only, not in the main database
              console.log(`[TRANSCRIPTION] Adding ${segments ? segments.length : 0} timestamped segments to vector DB only`);
              
              await storage.updateModuleTranscription(existingTranscription.id, updateData);
            } else {
              // Create an insert object with only the basic fields that match our schema
              const transcriptionData: any = {
                moduleId,
                videoId,
                text: transcript
              };
              
              // We'll store the segments in vector database only, not in the main database
              console.log(`[TRANSCRIPTION] Adding ${segments ? segments.length : 0} timestamped segments to vector DB only`);
              
              await storage.createModuleTranscription(transcriptionData);
            }
          } catch (storageError) {
            console.error("[TRANSCRIPTION] Error saving transcription:", storageError);
            // We'll still continue to return the transcript even if storage fails
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