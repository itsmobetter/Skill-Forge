import { ApiConfig } from "@shared/schema";
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

interface GeminiService {
  generateText: (prompt: string) => Promise<string>;
  generateChatResponse: (messages: { role: string; content: string }[], context?: string) => Promise<string>;
  generateQuizQuestions: (content: string, numQuestions?: number) => Promise<any>;
  summarizeText: (text: string) => Promise<string>;
  generateStructuredContent: (prompt: string, systemInstruction: string) => Promise<any>;
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

    generateChatResponse: async (messages: { role: string; content: string }[], context?: string): Promise<string> => {
      try {
        const chat = model.startChat({
          history: messages.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          })),
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
          },
        });

        let prompt = "";
        if (context) {
          prompt = `Consider the following context information when answering: ${context}\n\n`;
        }
        
        // Get the last user message
        const lastUserMessage = messages[messages.length - 1];
        prompt += lastUserMessage.content;

        const result = await chat.sendMessage(prompt);
        return result.response.text();
      } catch (error: any) {
        console.error("Error generating chat response with Gemini:", error);
        throw new Error(`Failed to generate chat response: ${error.message}`);
      }
    },

    generateQuizQuestions: async (content: string, numQuestions: number = 5): Promise<any> => {
      try {
        const prompt = `
          Based on the following content, create ${numQuestions} multiple-choice quiz questions to test understanding of the key concepts.
          
          Content: "${content}"
          
          For each question:
          1. Provide a clear, concise question
          2. Provide exactly 4 answer options (labeled A, B, C, D)
          3. Indicate which option is correct
          
          Format your response as a JSON array with this structure:
          [
            {
              "question": "Question text here?",
              "options": [
                {"id": "A", "text": "First option"},
                {"id": "B", "text": "Second option"},
                {"id": "C", "text": "Third option"},
                {"id": "D", "text": "Fourth option"}
              ],
              "correctOptionId": "B"
            }
          ]
          
          Ensure all questions are directly related to the content provided and have only one correct answer.
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