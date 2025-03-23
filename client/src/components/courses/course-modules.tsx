import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, Lock, PlayCircle, FileText } from "lucide-react";

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

  const handleModuleClick = (module: Module) => {
    // Only allow clicking on unlocked modules
    if (module.order <= currentModuleOrder) {
      // If it's not the current module, update the current module
      if (module.order !== currentModuleOrder) {
        updateModuleMutation.mutate({ moduleId: module.id });
      }
    }
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
            const isLocked = module.order > currentModuleOrder;
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
                {module.hasQuiz && (
                  <FileText className={cn(
                    "h-4 w-4 ml-2",
                    isCurrent ? "text-primary-600" : "text-slate-400"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
