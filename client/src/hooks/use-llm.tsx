import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface LLMResponse {
  answer: string;
  sources?: string[];
}

interface LLMQuestion {
  courseId: string;
  question: string;
  moduleId?: string;
}

interface StreamChunk {
  chunk?: string;
  done?: boolean;
  error?: string;
}

interface UseLLMOptions {
  onSuccess?: (data: LLMResponse) => void;
  onError?: (error: Error) => void;
  onStream?: (chunk: string) => void;
  onStreamComplete?: (fullText: string) => void;
}

export function useLLM(options?: UseLLMOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  
  // Fetch API settings to check if streaming is enabled
  const { data: apiConfig } = useQuery({
    queryKey: ["/api/user/settings/api"],
  });

  const askQuestion = async (data: LLMQuestion): Promise<LLMResponse> => {
    setIsLoading(true);
    setError(null);
    
    // Check if streaming is enabled in API config
    const streamingEnabled = apiConfig?.streaming === true;
    
    if (streamingEnabled) {
      setIsStreaming(true);
      let fullText = '';
      
      try {
        // Use fetch directly for streaming response
        const response = await fetch('/api/llm/question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get streaming response');
        }
        
        // Process server-sent events
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Failed to get response stream reader');
        }
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value);
          
          // Process each SSE line
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6)) as StreamChunk;
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.chunk) {
                  fullText += data.chunk;
                  
                  // Call the onStream callback if provided
                  if (options?.onStream) {
                    options.onStream(data.chunk);
                  }
                }
                
                if (data.done) {
                  // Call the onStreamComplete callback if provided
                  if (options?.onStreamComplete) {
                    options.onStreamComplete(fullText);
                  }
                  
                  // Cleanup
                  setIsStreaming(false);
                  setIsLoading(false);
                  
                  // Call the onSuccess callback if provided
                  if (options?.onSuccess) {
                    options.onSuccess({ answer: fullText });
                  }
                  
                  return { answer: fullText };
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
        
        // Fallback in case 'done' event wasn't received
        setIsStreaming(false);
        setIsLoading(false);
        
        if (options?.onStreamComplete) {
          options.onStreamComplete(fullText);
        }
        
        if (options?.onSuccess) {
          options.onSuccess({ answer: fullText });
        }
        
        return { answer: fullText };
        
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsStreaming(false);
        
        toast({
          title: "Error",
          description: `Failed to get streaming answer: ${error.message}`,
          variant: "destructive",
        });
        
        if (options?.onError) {
          options.onError(error);
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Non-streaming implementation (original behavior)
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
