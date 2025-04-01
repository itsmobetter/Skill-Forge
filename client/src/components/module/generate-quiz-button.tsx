import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface GenerateQuizButtonProps {
  moduleId: string;
  courseId: string;
  hasTranscript: boolean;
  isAdmin: boolean;
}

export function GenerateQuizButton({ moduleId, courseId, hasTranscript, isAdmin }: GenerateQuizButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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
    if (!hasTranscript) {
      toast({
        title: 'Transcript Required',
        description: 'A transcript is required to generate quiz questions. Please add a video with a transcript first.',
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

  // Allow all users to generate quizzes
  const buttonVariant = isAdmin ? "outline" : "secondary";

  return (
    <Button
      variant={buttonVariant}
      onClick={handleGenerateQuiz}
      disabled={isGenerating || !hasTranscript}
      className="mt-4"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Quiz is Generating...
        </>
      ) : (
        'Generate Quiz'
      )}
    </Button>
  );
}