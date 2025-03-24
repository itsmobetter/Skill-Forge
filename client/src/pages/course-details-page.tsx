import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import VideoPlayer from "@/components/courses/video-player";
import CourseMaterials from "@/components/courses/course-materials";
import CourseModules from "@/components/courses/course-modules";
import AiAssistant from "@/components/chat/ai-assistant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Bookmark, Share, Download } from "lucide-react";
import QuizModal from "@/components/quiz/quiz-modal";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [, navigate] = useLocation();

  // Fetch course details
  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${id}`],
  });

  // Fetch current user progress
  const { data: userProgress } = useQuery({
    queryKey: [`/api/user/courses/${id}/progress`],
  });

  // Fetch course modules
  const { data: modules } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
  });

  // Fetch course materials
  const { data: materials } = useQuery({
    queryKey: [`/api/courses/${id}/materials`],
  });

  // Get current module based on progress
  const currentModule = modules?.find(module => 
    module.order === (userProgress?.currentModuleOrder || 1)
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Course not found</h2>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-semibold text-slate-900">{course.title}</h1>
              </div>
              <div>
                <Button variant="outline" className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-2/3">
                <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                  {currentModule && (
                    <VideoPlayer 
                      videoUrl={currentModule.videoUrl} 
                      courseId={course.id} 
                      moduleId={currentModule.id} 
                    />
                  )}
                  
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-medium text-slate-900">
                        {currentModule ? `Module ${currentModule.order}: ${currentModule.title}` : 'Course Introduction'}
                      </h2>
                      <div className="flex space-x-2">
                        {currentModule && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/courses/${id}/modules/${currentModule.id}`)}
                            className="text-xs"
                          >
                            View Module Details
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4">
                      <h3 className="text-lg font-medium text-slate-900 mb-2">About this module</h3>
                      <p className="text-slate-700 mb-4">
                        {currentModule?.description || course.description}
                      </p>
                      
                      {currentModule?.tags && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {currentModule.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      
                      {currentModule?.objectives && (
                        <div className="border-t border-slate-200 pt-4">
                          <h3 className="text-lg font-medium text-slate-900 mb-2">Learning Objectives</h3>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {currentModule.objectives.map((objective, index) => (
                              <li key={index}>{objective}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {currentModule?.hasQuiz && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <Button 
                            onClick={() => setIsQuizOpen(true)}
                            className="mt-2"
                          >
                            Take Module Quiz
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {materials && <CourseMaterials materials={materials} />}
              </div>
              
              <div className="lg:w-1/3">
                <AiAssistant courseId={course.id} moduleName={currentModule?.title} />
                
                {modules && (
                  <CourseModules 
                    modules={modules} 
                    currentModuleOrder={userProgress?.currentModuleOrder || 1}
                    courseId={course.id}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {isQuizOpen && currentModule && (
        <QuizModal 
          isOpen={isQuizOpen} 
          setIsOpen={setIsQuizOpen} 
          courseId={course.id}
          moduleId={currentModule.id}
        />
      )}
    </div>
  );
}
