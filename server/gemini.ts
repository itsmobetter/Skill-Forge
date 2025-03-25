import { ApiConfig } from "@shared/schema";
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

interface GeminiService {
  generateText: (prompt: string) => Promise<string>;
  generateChatResponse: (messages: { role: string; content: string }[], context?: string) => Promise<string>;
  generateQuizQuestions: (content: string, numQuestions?: number) => Promise<any>;
  summarizeText: (text: string) => Promise<string>;
  generateStructuredContent: (prompt: string, systemInstruction: string) => Promise<any>;
  generateTimestampedTranscript: (videoId: string) => Promise<{ transcript: string, segments: any[] }>;
}

export function createGeminiService(config: ApiConfig): GeminiService {
  // Initialize the Google Generative AI SDK
  const apiKey = process.env.GEMINI_API_KEY || config.apiKey;
  const modelName = config.model || "gemini-pro"; // Default to gemini-pro if not specified
  
  if (!apiKey) {
    console.error("No API key provided for Gemini");
    throw new Error("Gemini API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Configure the safety settings
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  // Create a model instance with the configured parameters
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    },
    safetySettings,
  });

  return {
    generateText: async (prompt: string): Promise<string> => {
      try {
        console.log(`Using model: ${modelName} with temperature: ${config.temperature}`);
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
      } catch (error: any) {
        console.error("Error generating text with Gemini:", error);
        throw new Error(`Failed to generate text with Gemini: ${error.message}`);
      }
    },
    
    generateTimestampedTranscript: async (videoId: string): Promise<{ transcript: string, segments: any[] }> => {
      try {
        console.log(`Generating timestamped transcript for video: ${videoId}`);
        
        // In a real implementation, we would use a transcription service or YouTube API
        // Here, we'll use Gemini to create a simulated transcript with timestamps
        const prompt = `
          Create a realistic educational transcript for a 10-minute video about quality management, ISO standards, or engineering education.
          
          The video's YouTube ID is ${videoId}.
          
          Format your response as a detailed transcript with 8-12 segments, each with:
          1. A start time (in seconds, from 0 to 600)
          2. An end time (in seconds, greater than start time)
          3. The spoken text for that segment
          
          Return the transcript in JSON format as an array of segments like this:
          [
            {
              "startTime": 0,
              "endTime": 45,
              "text": "Hello and welcome to this module on quality management systems..."
            },
            {
              "startTime": 46,
              "endTime": 92,
              "text": "In this section, we'll explore the key requirements of ISO 9001:2015..."
            }
          ]
          
          Make sure the segments flow naturally and cover technical details about quality management.
          Ensure the timestamps are in strictly ascending order with no gaps or overlaps.
        `;
        
        // Use structured content generation for more reliable JSON output
        const segments = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Lower temperature for more structured output
            maxOutputTokens: 1024,
          },
        });
        
        const responseText = segments.response.text();
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("Failed to parse transcript segments from response");
        }
        
        // Parse the JSON array of segments
        const parsedSegments = JSON.parse(jsonMatch[0]);
        
        // Create the full transcript by combining all segment texts
        const fullTranscript = parsedSegments.map((segment: any) => segment.text).join(' ');
        
        return { 
          transcript: fullTranscript,
          segments: parsedSegments
        };
      } catch (error: any) {
        console.error("Error generating timestamped transcript:", error);
        throw new Error(`Failed to generate timestamped transcript: ${error.message}`);
      }
    },

    generateChatResponse: async (messages: { role: string; content: string }[], context?: string): Promise<string> => {
      try {
        // Gemini only accepts "user" and "model" roles
        // If there's a system message, prepend it to the first user message
        let processedMessages = [];
        let systemMessage = messages.find(msg => msg.role === "system");
        let userMessages = messages.filter(msg => msg.role === "user");
        
        // If we have no user messages, this is an error case
        if (userMessages.length === 0) {
          throw new Error("At least one user message is required");
        }
        
        // If we have a system message, add it to the first user message
        if (systemMessage) {
          processedMessages.push({
            role: "user",
            content: systemMessage.content + "\n\n" + userMessages[0].content
          });
          
          // Add remaining user messages if any
          for (let i = 1; i < userMessages.length; i++) {
            processedMessages.push(userMessages[i]);
          }
        } else {
          // No system message, just use the user messages
          processedMessages = userMessages;
        }
        
        // Add context if available
        if (context) {
          const lastUserMsg = processedMessages[processedMessages.length - 1];
          processedMessages[processedMessages.length - 1] = {
            role: "user",
            content: `Consider the following context information when answering: ${context}\n\n${lastUserMsg.content}`
          };
        }
        
        // Generate direct content instead of using chat history
        const result = await model.generateContent({
          contents: processedMessages.map(msg => ({
            role: "user",
            parts: [{ text: msg.content }]
          })),
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
          }
        });
        
        return result.response.text();
      } catch (error: any) {
        console.error("Error generating chat response with Gemini:", error);
        throw new Error(`Failed to generate chat response: ${error.message}`);
      }
    },

    generateQuizQuestions: async (content: string, numQuestions: number = 5): Promise<any> => {
      try {
        const prompt = `
          You are an expert quality management instructor creating an assessment for engineering professionals.
          
          Based on the following content, create ${numQuestions} challenging multiple-choice quiz questions to assess understanding of key quality management concepts. The quiz will be used for employee competency assessment with an 80% passing threshold.
          
          Content: "${content}"
          
          Create questions that:
          1. Test comprehension of technical concepts, not just memorization
          2. Focus on practical application of quality management principles 
          3. Require critical thinking about real-world engineering scenarios
          4. Range in difficulty from basic understanding to advanced application
          5. Assess ability to apply standards such as ISO 9001 in workplace contexts
          6. Include questions about statistical quality control where applicable
          
          For each question:
          1. Write a clear, concise question stem focused on a single concept
          2. Create exactly 4 answer options (labeled A, B, C, D)
          3. Make all options plausible, but only one clearly correct
          4. Avoid obvious incorrect options or trick questions
          5. Ensure the correct option fully addresses the question
          
          Format your response as a JSON array with this structure:
          [
            {
              "text": "Detailed question text that tests application of concepts?",
              "options": [
                {"id": "A", "text": "First option with sufficient detail"},
                {"id": "B", "text": "Second option with sufficient detail"},
                {"id": "C", "text": "Third option with sufficient detail"},
                {"id": "D", "text": "Fourth option with sufficient detail"}
              ],
              "correctOptionId": "B"
            }
          ]
          
          Ensure questions are technically accurate and directly relevant to the content provided.
        `;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });

        const responseText = result.response.text();
        
        // Extract JSON from response (handle if there's any text before or after the JSON)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("Failed to parse quiz questions from response");
        }
        
        return JSON.parse(jsonMatch[0]);
      } catch (error: any) {
        console.error("Error generating quiz questions with Gemini:", error);
        throw new Error(`Failed to generate quiz questions: ${error.message}`);
      }
    },

    summarizeText: async (text: string): Promise<string> => {
      try {
        const prompt = `
          Please provide a concise summary of the following text, highlighting the key points and main ideas.
          Keep the summary clear and focused on the most important information.
          
          Text to summarize:
          "${text}"
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error: any) {
        console.error("Error summarizing text with Gemini:", error);
        throw new Error(`Failed to summarize text: ${error.message}`);
      }
    },
    
    generateStructuredContent: async (prompt: string, systemInstruction: string): Promise<any> => {
      try {
        // Combine system instruction and prompt
        const fullPrompt = `${systemInstruction}\n\n${prompt}`;
        
        // Generate content with structured output focus
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.2, // Lower temperature for more structured output
            maxOutputTokens: 1024,
          },
        });

        const responseText = result.response.text();
        
        // Attempt to extract JSON from the response
        try {
          // Look for JSON array or object in the response
          const jsonMatch = responseText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          
          // If no JSON found but response looks like it might be JSON
          if (responseText.includes('{') || responseText.includes('[')) {
            console.warn("Response contains JSON-like content but couldn't be parsed directly");
            // Just return the text for manual handling
            return responseText;
          }
          
          // No JSON found at all
          console.warn("No structured content detected in response");
          return null;
        } catch (parseError: any) {
          console.error("Error parsing structured content:", parseError);
          throw new Error(`Failed to parse structured content: ${parseError.message}`);
        }
      } catch (error: any) {
        console.error("Error generating structured content with Gemini:", error);
        throw new Error(`Failed to generate structured content: ${error.message}`);
      }
    },
  };
}