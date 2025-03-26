import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlarmClock, 
  Calendar, 
  BarChart
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, format } from 'date-fns';

interface QuizHistoryProps {
  courseId: string;
  moduleId: string;
  moduleName: string;
}

interface QuizQuestion {
  id: string;
  moduleId: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
}

interface QuizResult {
  id: number;
  userId: number;
  moduleId: string;
  score: number;
  passed: boolean;
  completedAt: string;
  answers: Record<string, string>; // Question ID -> selected option ID
  feedback: Record<string, boolean>; // Question ID -> correct/incorrect
}

export default function QuizHistory({ courseId, moduleId, moduleName }: QuizHistoryProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);

  // Fetch quiz results
  const { data: quizResults, isLoading: resultsLoading } = useQuery<QuizResult[]>({
    queryKey: [`/api/courses/${courseId}/modules/${moduleId}/quiz/results`],
  });

  // Fetch quiz questions
  const { data: questions, isLoading: questionsLoading } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/courses/${courseId}/modules/${moduleId}/quiz/questions`],
    enabled: detailsOpen && !!selectedResult,
  });

  const isLoading = resultsLoading || (detailsOpen && questionsLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-slate-500">
          <AlarmClock className="h-4 w-4 animate-pulse" />
          <span>Loading quiz history...</span>
        </div>
      </div>
    );
  }

  if (!quizResults || quizResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <XCircle className="h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">No Quiz Attempts Yet</h3>
        <p className="text-sm text-slate-500 max-w-md">
          You haven't attempted the quiz for this module yet. Complete the module
          and take the quiz to see your results here.
        </p>
      </div>
    );
  }

  // Sort results by date, most recent first
  const sortedResults = [...quizResults].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const handleViewDetails = (result: QuizResult) => {
    setSelectedResult(result);
    setDetailsOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPp'); // Format: Oct 29, 2023, 9:30 AM
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Latest attempt card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {sortedResults[0].passed ? (
                  <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                    <XCircle className="h-7 w-7 text-red-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {sortedResults[0].passed ? 'Quiz Passed' : 'Quiz Failed'}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> 
                    Latest attempt: {formatDistanceToNow(new Date(sortedResults[0].completedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 rounded-full px-3 py-1 text-slate-800 font-medium">
                  {sortedResults[0].score}%
                </div>
                <Button onClick={() => handleViewDetails(sortedResults[0])}>
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accordion for all attempts */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="attempts">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                All Quiz Attempts ({sortedResults.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {sortedResults.map((result, index) => (
                  <Card key={result.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={result.passed ? "default" : "destructive"} className={result.passed ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                              {result.passed ? "Passed" : "Failed"}
                            </Badge>
                            <span className="text-sm text-slate-800 font-medium">
                              Attempt #{sortedResults.length - index}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatDate(result.completedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 text-sm font-medium">
                            Score: {result.score}%
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(result)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Detailed results dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
            <DialogDescription>
              {moduleName} - Completed {selectedResult && formatDistanceToNow(new Date(selectedResult.completedAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && questions && (
            <div className="py-4">
              <div className="flex flex-col items-center gap-1 mb-6">
                <div className={`text-3xl font-bold ${selectedResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedResult.score}%
                </div>
                <Badge variant={selectedResult.passed ? "default" : "destructive"} className={`${selectedResult.passed ? "bg-green-100 text-green-800 hover:bg-green-100" : ""} text-xs px-2`}>
                  {selectedResult.passed ? "Passed" : "Failed"}
                </Badge>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(selectedResult.completedAt)}
                </p>
              </div>

              <h3 className="font-medium text-sm mb-3">Question Details</h3>
              
              <ScrollArea className="max-h-[40vh]">
                <div className="space-y-4 pr-4">
                  {questions.map((question, index) => {
                    const isCorrect = selectedResult.feedback[question.id];
                    const selectedOptionId = selectedResult.answers[question.id];
                    const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
                    
                    return (
                      <div 
                        key={question.id} 
                        className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="space-y-2 flex-1">
                            <p className="font-medium">Question {index + 1}</p>
                            <p className="text-sm">{question.text}</p>
                            
                            <div className="mt-2 pl-1">
                              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Your answer:</p>
                              <div className={`text-sm rounded p-2 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {selectedOption?.text || "No answer selected"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}