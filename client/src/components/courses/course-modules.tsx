import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, Lock, PlayCircle, FileText, ExternalLink, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: string;
  videoUrl: string;
  completed: boolean;
  hasQuiz: boolean;
}

interface CourseModulesProps {
  modules: Module[];
  currentModuleOrder: number;
  courseId: string;
}

export default function CourseModules({ modules, currentModuleOrder, courseId }: CourseModulesProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch course data to get the title
  const { data: course } = useQuery<{
    id: string;
    title: string;
    imageUrl: string;
  }>({
    queryKey: [`/api/courses/${courseId}`],
  });
  
  // Fetch user's course progress
  const { data: userProgress } = useQuery<{
    id: number;
    userId: number;
    courseId: string;
    progress: number;
    completed: boolean;
  }>({
    queryKey: [`/api/user/courses/${courseId}/progress`],
  });
  
  // Mutation to update current module
  const updateModuleMutation = useMutation({
    mutationFn: async ({ moduleId }: { moduleId: string }) => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/modules/${moduleId}/start`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/courses/${courseId}/progress`] });
    },
  });
  
  // Mutation to generate a certificate
  const generateCertificateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", '/api/certificates', {
        userId: userProgress?.userId,
        courseId,
        courseName: course?.title || '',
        issuedDate: new Date(),
        credentialId: `CERT-${Date.now().toString(36)}`,
        thumbnailUrl: course?.imageUrl || ''
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Certificate Generated",
        description: "Your course completion certificate has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/certificates"] });
      navigate('/certificates');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate certificate.",
        variant: "destructive"
      });
    }
  });

  const handleModuleClick = (module: Module) => {
    // Always allow clicking on any module (removed restriction)
    // Update the current module in course progress
    updateModuleMutation.mutate({ 
      moduleId: module.id 
    });
    
    // Navigate to module details page
    navigate(`/courses/${courseId}/modules/${module.id}`);
  };
  
  const navigateToModuleDetails = (moduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/courses/${courseId}/modules/${moduleId}`);
  };

  // Check if all modules are completed
  const allModulesCompleted = modules.every(module => module.completed);
  
  // Function to handle certificate generation
  const handleCompleteCourse = () => {
    if (!allModulesCompleted) {
      toast({
        title: "Course Not Completed",
        description: "All modules must be completed before generating a certificate.",
        variant: "destructive"
      });
      return;
    }
    
    generateCertificateMutation.mutate();
  };

  return (
    <Card className="mt-6">
      <CardHeader className="px-4 py-3 border-b border-slate-200">
        <CardTitle className="text-lg font-medium">Course Modules</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-1">
          {modules.map((module) => {
            const isCurrent = module.order === currentModuleOrder;
            // Module is locked if it's beyond the current module order and not completed
            const isLocked = module.order > currentModuleOrder && !module.completed;
            const isCompleted = module.completed;
            
            return (
              <div
                key={module.id}
                className={cn(
                  "flex items-center p-2 rounded-lg transition-colors",
                  isCurrent && "bg-primary-50 text-primary-700",
                  !isCurrent && !isLocked && "hover:bg-slate-50 cursor-pointer",
                  isLocked && "text-slate-400 cursor-not-allowed"
                )}
                onClick={() => !isLocked && handleModuleClick(module)}
              >
                <div className="mr-3">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : isCurrent ? (
                    <PlayCircle className="h-5 w-5 text-primary-600 fill-primary-100" />
                  ) : isLocked ? (
                    <Lock className="h-5 w-5 text-slate-400" />
                  ) : (
                    <PlayCircle className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-primary-700", 
                    isLocked && "text-slate-400"
                  )}>
                    {module.order}. {module.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {module.duration} {isCurrent && "• Current"}
                  </p>
                </div>
                <div className="flex items-center ml-2">
                  {module.hasQuiz && (
                    <FileText className={cn(
                      "h-4 w-4 mr-2",
                      isCurrent ? "text-primary-600" : "text-slate-400"
                    )} />
                  )}
                  
                  {!isLocked && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => navigateToModuleDetails(module.id, e)}
                      title="View module details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      
      {/* Complete Course button shown only if user is enrolled and has progress */}
      {userProgress && (
        <CardFooter className="px-6 py-4 border-t border-slate-200">
          <Button 
            className="w-full"
            disabled={!allModulesCompleted || generateCertificateMutation.isPending}
            onClick={handleCompleteCourse}
          >
            {generateCertificateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Certificate...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" />
                {allModulesCompleted ? "Complete Course & Get Certificate" : "Complete All Modules To Get Certificate"}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
