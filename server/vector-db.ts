import { ChromaClient, Collection, OpenAIEmbeddingFunction } from "chromadb";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

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
 * VectorDB service handles interactions with ChromaDB for transcript storage and retrieval
 */
class VectorDB {
  private client: ChromaClient;
  private transcriptsCollection: Collection | null = null;
  private embedFunction: OpenAIEmbeddingFunction | null = null;
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
      if (process.env.OPENAI_API_KEY) {
        this.embedFunction = new OpenAIEmbeddingFunction({
          openai_api_key: process.env.OPENAI_API_KEY,
          // Using ada model as it's cost-effective for embedding
          model_name: "text-embedding-3-small"
        });
      } else {
        console.warn("OPENAI_API_KEY not set, vector search will use basic matching");
      }

      // Check if collection exists, create if not
      const collections = await this.client.listCollections();
      if (!collections.find(col => col.name === "transcripts")) {
        this.transcriptsCollection = await this.client.createCollection({
          name: "transcripts",
          embeddingFunction: this.embedFunction || undefined,
          metadata: { description: "Course module transcripts" }
        });
      } else {
        this.transcriptsCollection = await this.client.getCollection({
          name: "transcripts",
          embeddingFunction: this.embedFunction || undefined,
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
          const metadata = results.metadatas[0][idx];
          return {
            id,
            moduleId: metadata.moduleId,
            courseId: metadata.courseId,
            text: results.documents[0][idx],
            startTime: parseFloat(metadata.startTime),
            endTime: parseFloat(metadata.endTime)
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