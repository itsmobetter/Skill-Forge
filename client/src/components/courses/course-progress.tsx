import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CourseProgressProps {
  course: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    progress: number;
    currentModule?: number;
    totalModules?: number;
  };
}

export default function CourseProgress({ course }: CourseProgressProps) {
  return (
    <Card className="shadow rounded-lg overflow-hidden mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center">
          <img 
            src={course.imageUrl} 
            alt={course.title} 
            className="w-full sm:w-40 h-24 object-cover rounded-lg mb-4 sm:mb-0" 
          />
          <div className="sm:ml-6 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-slate-900">{course.title}</h3>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{course.description}</p>
              </div>
              <Badge className="hidden sm:block bg-orange-500 hover:bg-orange-600 text-white">In Progress</Badge>
            </div>
            <div className="mt-2">
              <div className="relative pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-primary-600">
                      {course.progress}% Complete
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-slate-600">
                      {course.currentModule && course.totalModules 
                        ? `Module ${course.currentModule}/${course.totalModules}`
                        : 'In progress'}
                    </span>
                  </div>
                </div>
                <Progress value={course.progress} className="h-2 mt-1" />
              </div>
            </div>
            <div className="mt-4">
              <Link href={`/course/${course.id}`}>
                <Button>Continue</Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
