import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
}

interface AnswerSubmission {
  questionId: string;
  answerId: string;
}

export default function QuizModal({ 
  open, 
  onClose, 
  courseId, 
  moduleId,
  onQuizComplete
}: { 
  open: boolean; 
  onClose: () => void; 
  courseId: string; 
  moduleId: string; 
  onQuizComplete?: (passed: boolean) => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number; feedback: Record<string, boolean>; passed: boolean }>({ 
    correct: 0, 
    total: 0, 
    feedback: {},
    passed: false
  });
  const { toast } = useToast();

  // Fetch quiz questions
  const { data: questions, isLoading, isError, error } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/courses/${courseId}/modules/${moduleId}/quiz`],
    enabled: open,
    retry: 1,
  });

  // Submit answers mutation
  const submitAnswersMutation = useMutation({
    mutationFn: async (answers: AnswerSubmission[]) => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/modules/${moduleId}/quiz/submit`, { answers });
      return await res.json();
    },
    onSuccess: (data) => {
      const passed = data.correct / data.total >= 0.8;
      setResults({
        correct: data.correct,
        total: data.total,
        feedback: data.feedback,
        passed: passed
      });
      setShowResults(true);

      // Always invalidate quiz results query to update history
      queryClient.invalidateQueries({ 
        queryKey: [`/api/courses/${courseId}/modules/${moduleId}/quiz/results`] 
      });
      
      // Also invalidate quiz questions to ensure fresh data on retries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/courses/${courseId}/modules/${moduleId}/quiz`] 
      });

      // If passed, invalidate the course progress
      if (passed) {
        queryClient.invalidateQueries({ queryKey: [`/api/user/courses/${courseId}/progress`] });
        
        toast({
          title: "Quiz Completed!",
          description: "You've passed the quiz and can now proceed to the next module.",
        });
        
        if (onQuizComplete) {
          onQuizComplete(true);
        }
      } else {
        toast({
          title: "Quiz Attempt Recorded",
          description: "You can review your results and try again. You need 80% to pass.",
        });
        
        if (onQuizComplete) {
          onQuizComplete(false);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit quiz: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
    }
  }, [open]);

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Handle previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Handle quiz submission
  const handleSubmitQuiz = () => {
    if (!questions) return;
    
    // Check if all questions are answered
    if (Object.keys(selectedAnswers).length < questions.length) {
      toast({
        title: "Missing answers",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Format answers for submission
    const answers = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
      questionId,
      answerId
    }));

    submitAnswersMutation.mutate(answers);
  };

  // Handle close and reset
  const handleClose = () => {
    onClose();
  };

  // Calculate progress percentage
  const progressPercentage = questions 
    ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) 
    : 0;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quiz Unavailable</DialogTitle>
            <DialogDescription>
              The quiz for this module is not available at the moment. This may be because:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="bg-red-100 text-red-800 p-1 rounded-full mr-2 flex-shrink-0">•</span>
                <span>The module does not have a valid video transcription, which is required for quiz generation.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-red-100 text-red-800 p-1 rounded-full mr-2 flex-shrink-0">•</span>
                <span>The administrator needs to generate quiz questions for this module.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-red-100 text-red-800 p-1 rounded-full mr-2 flex-shrink-0">•</span>
                <span>There was an error retrieving the quiz questions from the server.</span>
              </li>
            </ul>
            
            <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
              <p className="text-blue-800 text-sm">
                You can proceed with the module by watching the video content and reviewing available materials. Check back later for the quiz.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {!showResults ? (
          <>
            <DialogHeader>
              <DialogTitle>Module Quiz</DialogTitle>
              <DialogDescription>
                Question {currentQuestionIndex + 1} of {questions.length}
              </DialogDescription>
              <Progress value={progressPercentage} className="mt-2" />
            </DialogHeader>

            <div className="py-4">
              <h3 className="font-medium text-base mb-4">{currentQuestion.text}</h3>
              <RadioGroup 
                value={selectedAnswers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer py-2">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter className="flex justify-between">
              <div>
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
              </div>
              <div>
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswers[currentQuestion.id]}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={!selectedAnswers[currentQuestion.id] || submitAnswersMutation.isPending}
                  >
                    {submitAnswersMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Quiz Results</DialogTitle>
              <DialogDescription>
                You scored {results.correct} out of {results.total} questions correctly.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="mb-6 text-center">
                {results.passed ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
                    <h3 className="text-xl font-semibold text-green-600">Passed!</h3>
                    <p className="text-slate-600 mt-1">
                      Congratulations! You've passed the quiz and can proceed to the next module.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <XCircle className="h-16 w-16 text-red-500 mb-2" />
                    <h3 className="text-xl font-semibold text-red-600">Try Again</h3>
                    <p className="text-slate-600 mt-1">
                      You need to score at least 80% to pass. Review the material and try again.
                    </p>
                  </div>
                )}
              </div>

              {/* Add max height with scrolling for long result lists */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {questions.map((question, index) => {
                  // Determine if the answer was correct - use the feedback map
                  const isCorrect = results.feedback[question.id] === true;
                  
                  return (
                    <div 
                      key={question.id} 
                      className={cn(
                        "p-3 rounded-lg",
                        isCorrect 
                          ? "bg-green-50 border border-green-100" 
                          : "bg-red-50 border border-red-100"
                      )}
                    >
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <p className="text-sm text-slate-700">{question.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button onClick={handleClose}>Close</Button>
              {results.passed && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-2">You can continue with the course after reviewing your scores</p>
                </div>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
