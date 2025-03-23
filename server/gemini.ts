import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * Helper service for interacting with Google's Gemini AI models
 */
export class GeminiService {
  private apiKey: string;
  private model: string;
  private client: GoogleGenerativeAI;
  private generativeModel: GenerativeModel;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
    this.client = new GoogleGenerativeAI(apiKey);
    this.generativeModel = this.client.getGenerativeModel({ model: this.model });
  }

  /**
   * Ask a question to the Gemini model
   */
  async askQuestion(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const chatSession = this.generativeModel.startChat({
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        // Add system instructions if provided
        ...(systemInstruction && { history: [{ role: 'user', parts: [{ text: systemInstruction }] }] }),
      });

      const result = await chatSession.sendMessage(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error asking question to Gemini:', error);
      throw new Error(`Failed to get response from Gemini: ${(error as Error).message}`);
    }
  }

  /**
   * Generate structured content using JSON mode
   */
  async generateStructuredContent(prompt: string, systemInstruction?: string): Promise<any> {
    try {
      // For Gemini, we'll use a workaround for JSON generation by asking explicitly
      const jsonPrompt = `${prompt}\n\nPlease format your response as valid JSON.`;
      
      const chatSession = this.generativeModel.startChat({
        generationConfig: {
          temperature: 0.2, // Lower temperature for more deterministic output
          maxOutputTokens: 2048,
        },
        ...(systemInstruction && { history: [{ role: 'user', parts: [{ text: systemInstruction }] }] }),
      });

      const result = await chatSession.sendMessage(jsonPrompt);
      const responseText = result.response.text();
      
      // Extract JSON from the response (handling cases where the model might wrap JSON in ```json blocks)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        [null, responseText];
                        
      const jsonString = jsonMatch[1] || responseText;
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error generating structured content with Gemini:', error);
      throw new Error(`Failed to generate structured content: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a mock transcription for a video
   * Note: Gemini doesn't directly transcribe videos, so this is a simulation
   */
  async generateTranscription(videoTopic: string): Promise<string> {
    try {
      const prompt = `Generate a realistic transcript for an educational video about ${videoTopic}. The transcript should be around 500-1000 words and focus on educational content.`;
      
      const result = await this.generativeModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating transcription with Gemini:', error);
      throw new Error(`Failed to generate transcription: ${(error as Error).message}`);
    }
  }
}

/**
 * Create a GeminiService instance with the API key
 */
export function createGeminiService(apiKey: string, model?: string): GeminiService {
  return new GeminiService(apiKey, model);
}