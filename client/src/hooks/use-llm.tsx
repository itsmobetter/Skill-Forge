import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LLMResponse {
  answer: string;
  sources?: string[];
}

interface LLMQuestion {
  courseId: string;
  question: string;
  moduleId?: string;
}

interface UseLLMOptions {
  onSuccess?: (data: LLMResponse) => void;
  onError?: (error: Error) => void;
}

export function useLLM(options?: UseLLMOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const askQuestion = async (data: LLMQuestion): Promise<LLMResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/llm/question", data);
      const result = await response.json();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      toast({
        title: "Error",
        description: `Failed to get answer: ${error.message}`,
        variant: "destructive",
      });
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async (courseId: string, moduleId: string, count: number = 5): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/llm/generate-quiz", { 
        courseId, 
        moduleId,
        count
      });
      
      const result = await response.json();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      toast({
        title: "Error",
        description: `Failed to generate quiz: ${error.message}`,
        variant: "destructive",
      });
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getTranscription = async (videoUrl: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/llm/transcribe", { videoUrl });
      const result = await response.json();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      toast({
        title: "Error",
        description: `Failed to get transcription: ${error.message}`,
        variant: "destructive",
      });
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    askQuestion,
    generateQuiz,
    getTranscription,
    isLoading,
    error
  };
}
