import { ChromaClient, Collection } from "chromadb";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { createGeminiService } from "./gemini";

/**
 * TimestampedTranscript represents a transcript segment with start and end times
 */
export interface TimestampedTranscript {
  id: string;
  moduleId: string;
  courseId: string;
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

/**
 * Custom embedding function for Google Gemini
 */
class GeminiEmbeddingFunction {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.model = "embedding-001"; // Using Google's embedding model
  }

  async generate(texts: string[]): Promise<number[][]> {
    try {
      // Use default configuration with just the API key
      const geminiService = createGeminiService({
        userId: 0,
        provider: "Google AI",
        model: "gemini-1.5-flash",
        apiKey: this.apiKey,
        endpoint: null,
        temperature: 0.7,
        maxTokens: 1024,
        useTranscriptions: true,
        usePdf: true,
        streaming: false
      });
      
      // Process each text to generate embeddings
      const embeddings: number[][] = [];
      
      for (const text of texts) {
        // Use Gemini to generate a structured response representing an embedding
        // We'll request a fixed-size array of numbers as the embedding
        const prompt = `Generate a numerical embedding vector representation of the following text. 
        Return only a JSON array of 384 floating point numbers between -1 and 1 that represents the semantic meaning of the text:
        
        "${text}"`;
        
        try {
          const embeddingJson = await geminiService.generateStructuredContent(
            prompt,
            "You are an embedding generation system. Generate a numerical embedding vector that represents the semantic meaning of text. Return only an array of 384 floating point numbers between -1 and 1. No explanation or other text."
          );
          
          if (Array.isArray(embeddingJson) && embeddingJson.length === 384) {
            embeddings.push(embeddingJson);
          } else {
            // Fallback: Generate a simple hash-based representation
            console.warn("Invalid embedding format from Gemini, using fallback");
            embeddings.push(this.generateFallbackEmbedding(text));
          }
        } catch (err) {
          console.error("Error generating embedding with Gemini:", err);
          embeddings.push(this.generateFallbackEmbedding(text));
        }
      }
      
      return embeddings;
    } catch (error) {
      console.error("Embedding generation error:", error);
      // Return fallback embeddings for all texts
      return texts.map(text => this.generateFallbackEmbedding(text));
    }
  }
  
  // Fallback function that creates a simple embedding from text
  private generateFallbackEmbedding(text: string): number[] {
    // Create a simple hash-based representation (not for production use)
    const embedding = new Array(384).fill(0);
    
    // Simple hashing function to populate the embedding
    const normalizedText = text.toLowerCase();
    for (let i = 0; i < normalizedText.length; i++) {
      const charCode = normalizedText.charCodeAt(i);
      const position = i % 384;
      embedding[position] = (embedding[position] + charCode / 255) / 2; // Keep values between 0 and 1
    }
    
    // Normalize the embedding values to be between -1 and 1
    const sum = embedding.reduce((acc, val) => acc + val, 0);
    return embedding.map(val => (val - 0.5) * 2);
  }
}

/**
 * VectorDB service handles interactions with ChromaDB for transcript storage and retrieval
 */
class VectorDB {
  private client: ChromaClient;
  private transcriptsCollection: Collection | null = null;
  private embedFunction: GeminiEmbeddingFunction | null = null;
  private dataDirectory: string;
  private initialized: boolean = false;

  constructor() {
    this.dataDirectory = path.join(process.cwd(), "chroma_data");
    this.client = new ChromaClient({ path: "http://localhost:8000" }); // Using HTTP mode initially
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }
  }

  /**
   * Initialize the vector database
   */
  async initialize() {
    try {
      if (process.env.GEMINI_API_KEY) {
        this.embedFunction = new GeminiEmbeddingFunction(process.env.GEMINI_API_KEY);
      } else {
        console.warn("GEMINI_API_KEY not found for vector embeddings, will use basic matching");
      }

      // Check if collection exists, create if not
      const collections = await this.client.listCollections();
      const collectionName = "transcripts";
      
      if (!collections.some(col => typeof col === 'object' && col !== null && 'name' in col && col.name === collectionName)) {
        this.transcriptsCollection = await this.client.createCollection({
          name: collectionName,
          metadata: { description: "Course module transcripts" }
        });
      } else {
        this.transcriptsCollection = await this.client.getCollection({
          name: collectionName
        });
      }

      this.initialized = true;
      console.log("Vector DB initialized successfully");
    } catch (error) {
      console.error("Failed to initialize vector DB:", error);
      // Fallback to non-vector mode
      this.initialized = false;
    }
  }

  /**
   * Add timestamped transcript segments to the vector database
   */
  async addTranscriptSegments(segments: TimestampedTranscript[], videoId: string): Promise<string | null> {
    if (!this.initialized || !this.transcriptsCollection) {
      await this.initialize();
      if (!this.initialized) {
        console.error("Vector DB not initialized, skipping");
        return null;
      }
    }

    try {
      const vectorId = nanoid(10);
      
      // Prepare data for vector storage
      const ids = segments.map(segment => segment.id);
      const texts = segments.map(segment => segment.text);
      const metadatas = segments.map(segment => ({
        moduleId: segment.moduleId,
        courseId: segment.courseId,
        videoId,
        startTime: segment.startTime.toString(),
        endTime: segment.endTime.toString(),
      }));

      // Add to collection
      await this.transcriptsCollection.add({
        ids,
        documents: texts,
        metadatas
      });

      return vectorId;
    } catch (error) {
      console.error("Error adding transcript segments to vector DB:", error);
      return null;
    }
  }

  /**
   * Search for relevant transcript segments based on a query
   */
  async searchTranscripts(query: string, moduleId?: string, courseId?: string, limit: number = 5): Promise<TimestampedTranscript[]> {
    if (!this.initialized || !this.transcriptsCollection) {
      await this.initialize();
      if (!this.initialized) {
        console.error("Vector DB not initialized, skipping search");
        return [];
      }
    }

    try {
      // Build where clause based on provided filters
      const where: Record<string, any> = {};
      if (moduleId) where.moduleId = moduleId;
      if (courseId) where.courseId = courseId;

      // Perform the search
      const results = await this.transcriptsCollection.query({
        queryTexts: [query],
        where: Object.keys(where).length > 0 ? where : undefined,
        nResults: limit
      });

      // Format results
      if (results.ids.length > 0 && results.ids[0].length > 0) {
        return results.ids[0].map((id, idx) => {
          if (!results.metadatas || !results.metadatas[0] || !results.documents || !results.documents[0]) {
            return {
              id: id.toString(),
              moduleId: "",
              courseId: "",
              text: "",
              startTime: 0,
              endTime: 0
            };
          }
          
          const metadata = results.metadatas[0][idx];
          if (!metadata) {
            return {
              id: id.toString(),
              moduleId: "",
              courseId: "",
              text: results.documents[0][idx] || "",
              startTime: 0,
              endTime: 0
            };
          }
          
          return {
            id: id.toString(),
            moduleId: String(metadata.moduleId || ""),
            courseId: String(metadata.courseId || ""),
            text: String(results.documents[0][idx] || ""),
            startTime: typeof metadata.startTime === 'string' ? parseFloat(metadata.startTime) : 0,
            endTime: typeof metadata.endTime === 'string' ? parseFloat(metadata.endTime) : 0
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error("Error searching transcript segments:", error);
      return [];
    }
  }

  /**
   * Remove transcript segments for a module
   */
  async removeModuleTranscripts(moduleId: string): Promise<boolean> {
    if (!this.initialized || !this.transcriptsCollection) {
      await this.initialize();
      if (!this.initialized) {
        console.error("Vector DB not initialized, skipping deletion");
        return false;
      }
    }

    try {
      await this.transcriptsCollection.delete({
        where: { moduleId }
      });
      return true;
    } catch (error) {
      console.error("Error removing module transcripts:", error);
      return false;
    }
  }

  /**
   * Check if the vector database is initialized and ready
   */
  isInitialized(): boolean {
    return this.initialized && this.transcriptsCollection !== null;
  }
}

// Export singleton instance
export const vectorDB = new VectorDB();