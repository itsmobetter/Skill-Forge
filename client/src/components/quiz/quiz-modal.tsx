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

interface QuizModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  courseId: string;
  moduleId: string;
}

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

export default function QuizModal({ isOpen, setIsOpen, courseId, moduleId }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number; feedback: Record<string, boolean> }>({ 
    correct: 0, 
    total: 0, 
    feedback: {} 
  });
  const { toast } = useToast();

  // Fetch quiz questions
  const { data: questions, isLoading } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/courses/${courseId}/modules/${moduleId}/quiz`],
    enabled: isOpen,
  });

  // Submit answers mutation
  const submitAnswersMutation = useMutation({
    mutationFn: async (answers: AnswerSubmission[]) => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/modules/${moduleId}/quiz/submit`, { answers });
      return await res.json();
    },
    onSuccess: (data) => {
      setResults({
        correct: data.correct,
        total: data.total,
        feedback: data.feedback
      });
      setShowResults(true);

      // If passed, invalidate the course progress
      if (data.passed) {
        queryClient.invalidateQueries({ queryKey: [`/api/user/courses/${courseId}/progress`] });
        
        toast({
          title: "Quiz Completed!",
          description: "You've passed the quiz and can now proceed to the next module.",
        });
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
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
    }
  }, [isOpen]);

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
    setIsOpen(false);
  };

  // Calculate progress percentage
  const progressPercentage = questions 
    ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) 
    : 0;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quiz Unavailable</DialogTitle>
            <DialogDescription>
              The quiz for this module is not available at the moment. Please try again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                {results.correct / results.total >= 0.7 ? (
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
                      You need to score at least 70% to pass. Review the material and try again.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className={cn(
                      "p-3 rounded-lg",
                      results.feedback[question.id] 
                        ? "bg-green-50 border border-green-100" 
                        : "bg-red-50 border border-red-100"
                    )}
                  >
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">
                        {results.feedback[question.id] ? (
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
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
