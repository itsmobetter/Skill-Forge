
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface GenerateQuizButtonProps {
  moduleId: string;
  courseId: string;
  isAdmin: boolean;
}

export function GenerateQuizButton({ moduleId, courseId, isAdmin }: GenerateQuizButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscriptGenerating, setIsTranscriptGenerating] = useState(false);
  const { toast } = useToast();

  // Check if transcript exists
  const { data: transcriptionData, isLoading: isTranscriptLoading } = useQuery({
    queryKey: [`/api/modules/${moduleId}/transcription`],
    queryFn: async () => {
      try {
        const transcriptRes = await fetch(`/api/modules/${moduleId}/transcription`);
        if (!transcriptRes.ok) {
          return null;
        }
        return transcriptRes.json();
      } catch (error) {
        console.error('Error fetching transcript:', error);
        return null;
      }
    },
    refetchInterval: transcriptionData => {
      // Refetch every 5 seconds if transcript is being generated
      return !transcriptionData && isTranscriptGenerating ? 5000 : false;
    }
  });

  // Check for and start transcript generation if needed
  useEffect(() => {
    const checkAndGenerateTranscript = async () => {
      // If transcript is loading or already exists, don't continue
      if (isTranscriptLoading || transcriptionData) return;
      
      // No transcript found, get module info to check for video URL
      try {
        const moduleRes = await apiRequest('GET', `/api/courses/${courseId}/modules/${moduleId}`);
        const moduleData = await moduleRes.json();
        
        if (moduleData && moduleData.videoUrl) {
          setIsTranscriptGenerating(true);
          
          // Generate transcript
          await apiRequest('POST', '/api/llm/transcribe', {
            videoUrl: moduleData.videoUrl,
            moduleId: moduleId
          });
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: [`/api/modules/${moduleId}/transcription`] });
          queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules', moduleId] });
          
          setIsTranscriptGenerating(false);
        }
      } catch (error) {
        console.error('Error generating transcript:', error);
        setIsTranscriptGenerating(false);
      }
    };
    
    checkAndGenerateTranscript();
  }, [moduleId, courseId, isTranscriptLoading, transcriptionData]);

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      const timestamp = new Date().getTime();
      const uniqueId = Math.random().toString(36).substring(2, 15) + '-' + timestamp;
      
      // Create a helper function to log with consistent format
      const logMsg = (msg) => console.log(`[QUIZ GEN ${timestamp}] ${msg}`);
      
      logMsg(`Starting quiz generation for module ${moduleId}`);
      logMsg(`Using unique request ID: ${uniqueId}`);
      
      // STEP 0: First reset the database directly to ensure old questions are removed
      try {
        logMsg('STEP 0: Direct database reset to remove old questions');
        const resetUrl = `/api/courses/${courseId}/modules/${moduleId}/quiz/reset-database`;
        
        // Add cache-busting query parameter
        const resetUrlWithCache = `${resetUrl}?t=${timestamp}&r=${Math.random()}`;
        logMsg(`Calling ${resetUrlWithCache}`);
        
        const resetResponse = await fetch(resetUrlWithCache, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify({
            timestamp,
            requestId: uniqueId
          })
        });
        
        const resetResult = await resetResponse.json();
        logMsg(`Database reset result: ${JSON.stringify(resetResult)}`);
      } catch (resetError) {
        logMsg(`Error with database reset: ${resetError.message}`);
        // Continue anyway to try other approaches
      }
      
      // STEP 1: Then try the dedicated regeneration endpoint
      try {
        logMsg('STEP 1: Using dedicated regeneration endpoint');
        const regenerateUrl = `/api/courses/${courseId}/modules/${moduleId}/quiz/regenerate`;
        
        // Add cache-busting query parameter
        const finalUrl = `${regenerateUrl}?t=${timestamp}&r=${Math.random()}`;
        logMsg(`Calling ${finalUrl}`);
        
        const regenerateRes = await fetch(finalUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            timestamp,
            requestId: uniqueId,
            force: true
          })
        });
        
        if (regenerateRes.ok) {
          logMsg('Successfully regenerated quiz via dedicated endpoint');
          const result = await regenerateRes.json();
          return result;
        } else {
          const errorText = await regenerateRes.text();
          logMsg(`Regeneration failed: ${regenerateRes.status} - ${errorText}`);
          // Continue to fallback approach
        }
      } catch (regenerateError) {
        logMsg(`Error with regeneration endpoint: ${regenerateError.message}`);
        // Continue to fallback approach
      }
      
      // STEP 2: Fallback to direct LLM generation
      logMsg('STEP 2: Falling back to direct LLM generation');
      try {
        const directUrl = `/api/llm/generate-quiz?t=${timestamp}&r=${Math.random()}`;
        logMsg(`Calling ${directUrl}`);
        
        const res = await fetch(directUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            moduleId,
            courseId,
            forceRegenerate: true,
            archiveOld: true,
            timestamp,
            requestId: uniqueId,
            clearExisting: true,
            bypassCache: Math.random()
          })
        });
        
        logMsg(`Direct LLM request completed with status: ${res.status}`);
        return res.json();
      } catch (directError) {
        logMsg(`Error with direct LLM request: ${directError.message}`);
        throw directError;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Quiz Generated Successfully',
          description: `Created ${data.count} questions for this module.`,
        });
        
        // Invalidate module and quiz queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules', moduleId] });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/modules/${moduleId}/quiz`] });
      } else {
        toast({
          title: 'Quiz Generation Failed',
          description: data.message || 'Failed to generate quiz. Please try again.',
          variant: 'destructive',
        });
      }
      setIsGenerating(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Quiz Generation Failed',
        description: error.message || 'An error occurred while generating the quiz.',
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  });

  const handleGenerateQuiz = async () => {
    // If transcript is still being generated, show a message
    if (isTranscriptGenerating) {
      toast({
        title: 'Transcript Generation in Progress',
        description: 'Please wait while the transcript is being generated...',
        variant: 'destructive',
      });
      return;
    }

    // If no transcript exists yet, inform the user
    if (!transcriptionData) {
      toast({
        title: 'Transcript Required',
        description: 'A transcript is required and is being generated. Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    // Start the loading state
    setIsGenerating(true);

    // Handle the quiz generation
    try {
      await generateQuizMutation.mutateAsync(); // Await the mutation for better error handling
    } catch (error) {
      console.error("Quiz generation failed:", error);
      toast({
        title: 'Quiz Generation Error',
        description: 'An error occurred during quiz generation.',
        variant: 'destructive',
      });
    } finally {
      // Stop the loading state regardless of success or failure
      setIsGenerating(false);
    }
  };

  // Determine button text based on context
  const getButtonText = () => {
    if (isGenerating) {
      return 'Quiz is Generating...';
    } else if (isTranscriptGenerating) {
      return 'Preparing Quiz...';
    }
    
    // Check if module has a quiz already
    return 'Generate Quiz';
  };

  // Allow all users to generate quizzes
  const buttonVariant = isAdmin ? "outline" : "secondary";

  return (
    <Button
      variant={buttonVariant}
      onClick={handleGenerateQuiz}
      disabled={isGenerating || isTranscriptGenerating}
      className="mt-4"
    >
      {(isGenerating || isTranscriptGenerating) ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {getButtonText()}
        </>
      ) : (
        getButtonText()
      )}
    </Button>
  );
}
