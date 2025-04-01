import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpen, Video, File, CheckCircle, Circle, PencilRuler, History, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TranscriptViewer } from '@/components/module/transcript-viewer';
import { GenerateQuizButton } from '@/components/module/generate-quiz-button';
import QuizResults from '@/components/quiz/quiz-results';
import QuizHistory from '@/components/quiz/quiz-history';
import QuizModal from '@/components/quiz/quiz-modal';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Module, Course, Material } from '@shared/schema';

export default function ModuleDetailPage() {
  const [_, params] = useRoute('/courses/:courseId/modules/:moduleId');
  const { courseId, moduleId } = params || {};
  const [activeTab, setActiveTab] = useState('video');
  const [quizOpen, setQuizOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [moduleProgress, setModuleProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch module details
  const { data: module, isLoading: isLoadingModule } = useQuery<Module>({
    queryKey: ['/api/courses', courseId, 'modules', moduleId],
    queryFn: async () => {
      if (!courseId || !moduleId) return null;
      const res = await apiRequest('GET', `/api/courses/${courseId}/modules/${moduleId}`);
      return res.json();
    },
    enabled: !!courseId && !!moduleId
  });

  // Fetch course details
  const { data: course } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const res = await apiRequest('GET', `/api/courses/${courseId}`);
      return res.json();
    },
    enabled: !!courseId
  });

  // Fetch module materials
  const { data: materials } = useQuery<Material[]>({
    queryKey: ['/api/courses', courseId, 'materials'],
    queryFn: async () => {
      if (!courseId) return [];
      const res = await apiRequest('GET', `/api/courses/${courseId}/materials`);
      return res.json();
    },
    enabled: !!courseId
  });

  // Fetch user enrollment status
  const { data: courseProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['/api/user/courses', courseId, 'progress'],
    queryFn: async () => {
      try {
        if (!courseId) return null;
        const res = await apiRequest('GET', `/api/user/courses/${courseId}/progress`);
        const data = await res.json();
        setIsEnrolled(true);
        return data;
      } catch (error) {
        // If we get a 401 or 404, it means the user is not enrolled
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('404'))) {
          setIsEnrolled(false);
          return null;
        }
        throw error;
      }
    },
    retry: false,
    enabled: !!courseId
  });

  // Update module progress
  const updateProgress = async (progress: number) => {
    try {
      if (!courseId || !moduleId) return;
      
      if (!isEnrolled) {
        toast({
          title: 'Enrollment Required',
          description: 'Please enroll in this course to track progress',
          variant: 'destructive',
        });
        return;
      }
      
      const response = await apiRequest('POST', `/api/courses/${courseId}/modules/${moduleId}/progress`, {
        progress
      });
      
      // Update the local progress state
      setModuleProgress(progress);
      
      // Invalidate relevant queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: [`/api/user/courses/${courseId}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/modules`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard'] });
      
      // Also invalidate the specific module query to refresh its completion status
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/modules/${moduleId}`] });
      
      if (progress === 100) {
        // Also check if all modules are completed to ensure certificates can be unlocked
        queryClient.invalidateQueries({ queryKey: [`/api/user/certificates`] });
        
        toast({
          title: 'Module Completed',
          description: 'You have successfully completed this module.',
        });
      } else {
        toast({
          title: 'Progress Updated',
          description: `Progress updated to ${progress}%`,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to track progress',
          variant: 'destructive',
        });
      } else {
        console.error('Error updating progress:', error);
        toast({
          title: 'Update Failed',
          description: 'Failed to update progress',
          variant: 'destructive',
        });
      }
    }
  };

  // Format the YouTube video URL for embedding
  const getEmbedUrl = (videoUrl: string) => {
    if (!videoUrl) return '';
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
    }
    
    return videoUrl; // Return original if not a valid YouTube URL
  };

  // Filter materials for the current module
  const moduleMaterials = materials?.filter(
    material => material.courseId === courseId
  ) || [];

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Mark module as complete
  const markAsComplete = () => {
    updateProgress(100);
  };

  if (isLoadingModule) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!module || !courseId) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold">Module Not Found</h1>
          <p className="mt-4">The module you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{module.title}</h1>
        {course && (
          <p className="text-muted-foreground mt-1">Course: {course.title}</p>
        )}
        {module.description && (
          <p className="mt-4 text-lg">{module.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className={`grid w-full ${module.hasQuiz ? 'grid-cols-5' : 'grid-cols-3'}`}>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2">
                <File className="h-4 w-4" />
                Materials
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Transcript
              </TabsTrigger>
              {module.hasQuiz && (
                <>
                  <TabsTrigger value="quiz" className="flex items-center gap-2">
                    <PencilRuler className="h-4 w-4" />
                    Quiz
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="video" className="mt-4">
              {module.videoUrl ? (
                <div className="rounded-lg overflow-hidden aspect-video">
                  <iframe
                    className="w-full h-full"
                    src={getEmbedUrl(module.videoUrl)}
                    title={module.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-8 text-center h-[400px] flex items-center justify-center">
                  <div>
                    <p className="text-muted-foreground">No video available for this module</p>
                    {module.hasQuiz && (
                      <Button variant="outline" className="mt-4">
                        Take Quiz
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="materials" className="mt-4">
              {moduleMaterials.length > 0 ? (
                <div className="space-y-4">
                  {moduleMaterials.map((material) => (
                    <Card key={material.id}>
                      <CardHeader>
                        <CardTitle>{material.title}</CardTitle>
                        {material.description && (
                          <CardDescription>{material.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter>
                        <Button
                          variant="outline"
                          onClick={() => window.open(material.url, '_blank')}
                          className="w-full sm:w-auto"
                        >
                          View Material
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-8 text-center h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No materials available for this module</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="transcript" className="mt-4">
              <TranscriptViewer moduleId={moduleId || ''} videoUrl={module.videoUrl} />
              <GenerateQuizButton 
                moduleId={moduleId || ''} 
                courseId={courseId} 
                hasTranscript={!!module.videoUrl} 
                isAdmin={user?.isAdmin || false}
              />
            </TabsContent>
            
            <TabsContent value="quiz" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Module Quiz</CardTitle>
                  <CardDescription>
                    Test your knowledge of the concepts covered in this module
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {module.hasQuiz ? (
                      <>
                        <p>
                          This quiz will test your understanding of the key concepts covered in this module.
                          You need to score at least 80% to pass.
                        </p>
                        
                        {/* Quiz Results Component */}
                        <QuizResults moduleId={moduleId || ''} courseId={courseId} moduleName={module.title} />
                        
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                            <PencilRuler className="h-4 w-4" />
                            Quiz Instructions
                          </h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• The quiz consists of multiple-choice questions</li>
                            <li>• You need to score at least 80% to pass</li>
                            <li>• You can retake the quiz if you don't pass</li>
                            <li>• Review the module content before taking the quiz</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
                          <h3 className="text-lg font-medium text-yellow-800 mb-2">Quiz Requires Transcription</h3>
                          <p className="text-yellow-700">
                            The quiz will be available once the video transcription is generated.
                            {!module.videoUrl && " This module needs video content first."}
                          </p>
                        </div>
                        
                        {module.videoUrl ? (
                          <p className="text-slate-600">
                            The system will automatically generate a transcript when you watch the video.
                          </p>
                        ) : (
                          <p className="text-slate-600">
                            This module needs video content before a quiz can be created.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => setQuizOpen(true)}
                    disabled={!module.hasQuiz}
                  >
                    {module.hasQuiz ? "Start Quiz" : "Generate Quiz"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Quiz History</CardTitle>
                  <CardDescription>
                    View your previous quiz attempts and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuizHistory 
                    moduleId={moduleId || ''} 
                    courseId={courseId || ''} 
                    moduleName={module.title} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Module Progress</CardTitle>
              <CardDescription>Track your progress through this module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {module.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <span>Watch Video</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateProgress(30)}
                  >
                    Mark watched
                  </Button>
                </div>
                
                {moduleMaterials.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-2">
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span>Review Materials</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateProgress(60)}
                    >
                      Mark reviewed
                    </Button>
                  </div>
                )}
                
                {module.hasQuiz && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-2">
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span>Complete Quiz</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('quiz')}
                    >
                      Take quiz
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={markAsComplete}
              >
                Mark Module as Complete
              </Button>
            </CardFooter>
          </Card>

          {/* AI Assistant Card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>AI Learning Assistant</CardTitle>
              <CardDescription>Ask questions about this module</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = `/courses/${courseId}/chat?module=${moduleId}`}
              >
                Ask a Question
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Quiz Modal */}
      {module.hasQuiz && (
        <QuizModal
          open={quizOpen}
          onClose={() => setQuizOpen(false)}
          moduleId={moduleId || ''}
          courseId={courseId}
          onQuizComplete={(passed) => {
            setQuizOpen(false);
            if (passed) {
              updateProgress(100);
            }
          }}
        />
      )}
    </div>
  );
}