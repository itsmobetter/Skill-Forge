import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Award, Clock, BarChart } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface QuizResultsProps {
  courseId: string;
  moduleId: string;
  moduleName: string;
}

interface QuizResult {
  id: number;
  userId: number;
  moduleId: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

export default function QuizResults({ courseId, moduleId, moduleName }: QuizResultsProps) {
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch quiz results for this module
  const { data: quizResults, isLoading } = useQuery<QuizResult[]>({
    queryKey: [`/api/courses/${courseId}/modules/${moduleId}/quiz/results`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
        <Clock className="h-4 w-4" />
        Loading quiz results...
      </div>
    );
  }

  if (!quizResults || quizResults.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500">
        No quiz attempts for this module yet.
      </div>
    );
  }

  // Sort results by date, most recent first
  const sortedResults = [...quizResults].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const mostRecentResult = sortedResults[0];
  const bestResult = [...sortedResults].sort((a, b) => b.score - a.score)[0];

  const openResultDetails = (result: QuizResult) => {
    setSelectedResult(result);
    setDetailsOpen(true);
  };

  // Format the date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="quiz-results">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Quiz Results
              <Badge variant={mostRecentResult.passed ? "default" : "destructive"} className={`ml-2 ${mostRecentResult.passed ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}>
                {mostRecentResult.passed ? "Passed" : "Failed"}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Recent Attempts</h4>
                <span className="text-xs text-slate-500">{quizResults.length} attempts total</span>
              </div>
              
              {sortedResults.slice(0, 3).map((result) => (
                <Card key={result.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {result.passed ? "Passed" : "Failed"} - {result.score}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(result.completedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openResultDetails(result)}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {sortedResults.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => openResultDetails(sortedResults[0])}
                >
                  View all {sortedResults.length} attempts
                </Button>
              )}
              
              <div className="flex gap-3 mt-4">
                <Card className="flex-1">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      <div>
                        <span className="text-xs text-slate-500">Best Score</span>
                        <p className="font-medium">{bestResult.score}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="flex-1">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div>
                        <span className="text-xs text-slate-500">Last Attempt</span>
                        <p className="font-medium">{formatDistanceToNow(new Date(mostRecentResult.completedAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Quiz result details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quiz Results: {moduleName}</DialogTitle>
            <DialogDescription>
              Details of your quiz attempts for this module
            </DialogDescription>
          </DialogHeader>
          
          {selectedResult && (
            <div className="py-4 space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-slate-100 p-3 mb-3">
                  {selectedResult.passed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <h3 className="text-xl font-semibold">
                  {selectedResult.score}%
                </h3>
                <p className={`text-sm font-medium ${selectedResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedResult.passed ? 'Passed' : 'Failed'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Completed on {formatDate(selectedResult.completedAt)}
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2">About this quiz</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-slate-500">• Required score to pass:</span>
                    <span className="font-medium">80%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-500">• Your score:</span>
                    <span className="font-medium">{selectedResult.score}%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-500">• Status:</span>
                    <Badge variant={selectedResult.passed ? "default" : "destructive"} className={selectedResult.passed ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {selectedResult.passed ? "Passed" : "Failed"}
                    </Badge>
                  </li>
                </ul>
              </div>
              
              {!selectedResult.passed && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-md text-sm">
                  <p className="text-amber-800">
                    You need to score at least 80% to pass this quiz. Review the module content and try again.
                  </p>
                </div>
              )}
              
              {sortedResults.length > 1 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">All Attempts</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {sortedResults.map((result, index) => (
                      <div 
                        key={result.id} 
                        className={`p-2 rounded-md border ${
                          selectedResult.id === result.id 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              {result.passed ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span className="text-sm font-medium">
                                Attempt {sortedResults.length - index}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {formatDate(result.completedAt)}
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            {result.score}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}