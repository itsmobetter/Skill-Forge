import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import VideoPlayer from "@/components/courses/video-player";
import CourseMaterials from "@/components/courses/course-materials";
import CourseModules from "@/components/courses/course-modules";
import AiAssistant from "@/components/chat/ai-assistant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Bookmark, Share, Download, CheckCircle } from "lucide-react";
import QuizModal from "@/components/quiz/quiz-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Course, Module, Material, UserCourseProgress } from "@shared/schema";

// Type extension to fix type errors
type ExtendedModule = Module & {
  tags?: string[];
  objectives?: string[];
  videoUrl: string | null;
  transcriptId?: string; // Added to track transcript ID
  quizId?: string; // Added to track quiz ID
};

type ExtendedMaterial = Material & {
  type: string; // Allow any string type for material
};

// Extended interface for UserCourseProgress to include the userEnrolled flag
interface ExtendedUserCourseProgress extends UserCourseProgress {
  userEnrolled?: boolean;
  currentModuleId?: string; // Added to track current module by ID
  completed?: boolean; // Added to track overall course completion
}

export default function CourseDetailsPage() {
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Course enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      console.log(`Attempting to enroll in course with ID: ${id}`);
      try {
        const res = await apiRequest("POST", `/api/courses/${id}/enroll`, {});
        return await res.json();
      } catch (error) {
        console.error("Enrollment error:", error);
        if (error instanceof Error && error.message.includes("401")) {
          throw new Error("Please log in to enroll in this course");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Enrollment successful:", data);
      toast({
        title: "Enrolled Successfully",
        description: "You have successfully enrolled in this course.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user/courses/${id}/progress`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (error: Error) => {
      console.error("Enrollment error response:", error);
      if (error.message.includes("log in")) {
        navigate("/auth");
        toast({
          title: "Authentication Required",
          description: "Please log in to enroll in courses",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Enrollment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleEnrollCourse = () => {
    if (!id) {
      toast({
        title: "Enrollment Failed",
        description: "Course ID is missing",
        variant: "destructive",
      });
      return;
    }
    enrollMutation.mutate();
  };

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
  });

  const { data: userProgress } = useQuery<ExtendedUserCourseProgress>({
    queryKey: [`/api/user/courses/${id}/progress`],
  });

  const { data: modules } = useQuery<ExtendedModule[]>({
    queryKey: [`/api/courses/${id}/modules`],
  });

  const { data: materials } = useQuery<ExtendedMaterial[]>({
    queryKey: [`/api/courses/${id}/materials`],
  });


  const generateTranscriptMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const res = await apiRequest("POST", `/api/modules/${moduleId}/generate-transcript`);
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Transcript generated successfully:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/modules`] });
    },
    onError: (error) => {
      console.error("Transcript generation failed:", error);
      toast({ title: "Transcript Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  useEffect(() => {
    //Check for transcript on module load and generate if missing
    if (modules && currentModule && !currentModule.transcriptId) {
      generateTranscriptMutation.mutate(currentModule.id);
    }
  }, [modules, currentModule, generateTranscriptMutation]);

  const currentModule = userProgress?.currentModuleId
    ? modules?.find((module) => module.id === userProgress.currentModuleId)
    : modules?.[0];


  const completedModuleIds = userProgress?.completedModules || [];
  const isEnrolled = userProgress?.userEnrolled;


  // Check if user has completed all modules and passed all quizzes
  const isEligibleForCertificate = () => {
    // If course has 0 modules or user is not enrolled, return false
    if (modules?.length === 0 || !isEnrolled) return false;

    // Check if all modules are completed
    const allModulesCompleted = modules.every((module) =>
      completedModuleIds.includes(module.id)
    );

    // Check if course progress is marked as completed in database
    const courseCompleted = userProgress?.completed === true;

    // User is eligible if all modules are completed or if course is explicitly marked as completed
    return allModulesCompleted || courseCompleted;
  };

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
              <div className="flex space-x-2">
                {!userProgress?.userEnrolled ? (
                  <Button
                    onClick={handleEnrollCourse}
                    className="flex items-center gap-1"
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Bookmark className="h-4 w-4 mr-1" />
                    )}
                    Enroll Now
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => navigate(`/my-courses`)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Enrolled</span>
                  </Button>
                )}
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
                          {(currentModule.tags as string[]).map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      )}

                      {currentModule?.objectives && (
                        <div className="border-t border-slate-200 pt-4">
                          <h3 className="text-lg font-medium text-slate-900 mb-2">Learning Objectives</h3>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {(currentModule.objectives as string[]).map((objective: string, index: number) => (
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
                            disabled={!currentModule.transcriptId} // Disable if transcript is missing
                          >
                            {currentModule.transcriptId ? "Take Module Quiz" : "Generating Transcript..."}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {materials && <CourseMaterials materials={materials as any} />}
              </div>

              <div className="lg:w-1/3">
                <AiAssistant courseId={course.id} moduleName={currentModule?.title} />

                {modules && (
                  <CourseModules
                    modules={modules as any}
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
          open={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          courseId={course.id}
          moduleId={currentModule.id}
          onQuizComplete={(passed) => {
            console.log("Quiz completed, passed:", passed);
            //Update progress after quiz completion.  This needs backend support.
            // ... (Implementation for updating progress and certificate eligibility) ...
          }}
        />
      )}
    </div>
  );
}