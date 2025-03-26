import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QuizResult } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BarChart, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QuizHistoryProps {
  moduleId: string;
  courseId: string;
  moduleName: string;
}

interface QuizQuestion {
  id: string;
  moduleId: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

interface QuizResultWithDetails extends QuizResult {
  questions: QuizQuestion[];
  answers: { questionId: string; selectedOptionId: string }[];
}

export default function QuizHistory({ moduleId, courseId, moduleName }: QuizHistoryProps) {
  const [activeTab, setActiveTab] = useState('attempts');

  // Fetch quiz results
  const { data: quizResults, isLoading } = useQuery<QuizResultWithDetails[]>({
    queryKey: ['/api/courses', courseId, 'modules', moduleId, 'quiz/results'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/courses/${courseId}/modules/${moduleId}/quiz/results`);
      return res.json();
    },
    enabled: !!moduleId && !!courseId,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading quiz history...</p>
      </div>
    );
  }

  if (!quizResults || quizResults.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-muted rounded-md p-6">
          <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium mb-2">No Quiz Attempts Yet</h3>
          <p className="text-muted-foreground">
            You haven't taken any quizzes for this module yet.
            Try taking the quiz to see your results and history here.
          </p>
        </div>
      </div>
    );
  }

  // Sort results by completedAt (most recent first)
  const sortedResults = [...quizResults].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const getBadgeVariant = (score: number) => {
    return 'default'; // Using default variant with custom styling below
  };
  
  const getBadgeStyle = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'; 
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPassFailText = (score: number) => {
    return score >= 80 ? 'Passed' : 'Failed';
  };

  return (
    <div>
      <Tabs defaultValue="attempts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attempts">Attempt History</TabsTrigger>
          <TabsTrigger value="details">Question Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attempts" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[5%]">#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[15%]">Score</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead>Time Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.map((result, index) => (
                  <TableRow key={result.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {new Date(result.completedAt).toLocaleDateString()}{' '}
                      <span className="text-xs text-muted-foreground">
                        ({formatDistanceToNow(new Date(result.completedAt), { addSuffix: true })})
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{result.score}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(result.score)} className={getBadgeStyle(result.score)}>
                        {getPassFailText(result.score)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.timeSpentSeconds ? (
                          `${Math.floor(result.timeSpentSeconds / 60)}m ${result.timeSpentSeconds % 60}s`
                        ) : (
                          "Not tracked"
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Quiz Details:</strong> This module quiz requires a score of 80% or higher to pass.
              You've attempted this quiz {sortedResults.length} time{sortedResults.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="mt-4">
          {sortedResults.map((result, attemptIndex) => (
            <Card key={result.id} className={attemptIndex > 0 ? 'mt-4' : ''}>
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>
                    Attempt #{attemptIndex + 1} - {new Date(result.completedAt).toLocaleDateString()}
                    <span className="block text-xs text-muted-foreground">
                      Time taken: {result.timeSpentSeconds ? (
                        `${Math.floor(result.timeSpentSeconds / 60)}m ${result.timeSpentSeconds % 60}s`
                      ) : (
                        "Not tracked"
                      )}
                    </span>
                  </span>
                  <Badge variant={getBadgeVariant(result.score)} className={getBadgeStyle(result.score)}>
                    {result.score}% ({getPassFailText(result.score)})
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {result.questions && result.answers && result.questions.map((question, qIndex) => {
                      const userAnswer = result.answers.find(a => a.questionId === question.id);
                      const selectedOption = question.options.find(o => o.id === userAnswer?.selectedOptionId);
                      const correctOption = question.options.find(o => o.id === question.correctOptionId);
                      const isCorrect = userAnswer?.selectedOptionId === question.correctOptionId;
                      
                      return (
                        <div key={question.id} className="pb-4 border-b last:border-0">
                          <div className="flex gap-2">
                            <div className="flex-none pt-1">
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium mb-2">
                                Question {qIndex + 1}: {question.text}
                              </p>
                              
                              <div className="pl-1 space-y-1 text-sm">
                                {question.options.map(option => (
                                  <div 
                                    key={option.id} 
                                    className={`p-2 rounded ${
                                      option.id === question.correctOptionId
                                        ? 'bg-green-50 border border-green-100'
                                        : option.id === userAnswer?.selectedOptionId
                                          ? 'bg-red-50 border border-red-100'
                                          : ''
                                    }`}
                                  >
                                    {option.text}
                                    {option.id === question.correctOptionId && (
                                      <span className="ml-2 text-xs text-green-600">(Correct Answer)</span>
                                    )}
                                    {option.id === userAnswer?.selectedOptionId && option.id !== question.correctOptionId && (
                                      <span className="ml-2 text-xs text-red-600">(Your Answer)</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}