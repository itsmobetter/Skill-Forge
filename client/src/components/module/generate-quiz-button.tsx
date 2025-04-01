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
      
      console.log(`[QUIZ GEN ${timestamp}] Starting quiz generation for module ${moduleId}`);
      console.log(`[QUIZ GEN ${timestamp}] Using unique request ID: ${uniqueId}`);
      
      // First make a direct call to clear existing questions via the quiz API
      try {
        console.log(`[QUIZ GEN ${timestamp}] First attempting to clear existing questions via direct API call`);
        const clearRes = await apiRequest('POST', `/api/courses/${courseId}/modules/${moduleId}/quiz/regenerate`, {
          timestamp,
          requestId: uniqueId
        });
        
        if (clearRes.ok) {
          console.log(`[QUIZ GEN ${timestamp}] Successfully triggered regeneration via quiz API`);
        } else {
          console.error(`[QUIZ GEN ${timestamp}] Failed to trigger regeneration: ${await clearRes.text()}`);
        }
      } catch (clearError) {
        console.error(`[QUIZ GEN ${timestamp}] Error clearing questions:`, clearError);
      }
      
      // Now generate new questions
      console.log(`[QUIZ GEN ${timestamp}] Generating new quiz questions for module ${moduleId}`);
      const res = await apiRequest('POST', '/api/llm/generate-quiz', {
        moduleId,
        courseId,
        forceRegenerate: true,
        archiveOld: true,
        timestamp,
        requestId: uniqueId,
        clearExisting: true,
        bypassCache: Math.random() // Add random value to prevent any caching
      });
      
      console.log(`[QUIZ GEN ${timestamp}] Request completed with status: ${res.status}`);
      return res.json();
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