import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/layout/dashboard-layout";

// Define the type for course with progress
interface CourseWithProgress {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  progress: number;
  completed: boolean;
  duration: string;
  currentModule: number;
  totalModules: number;
}

export default function MyCoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  // Fetch user's enrolled courses
  const { data: courses, isLoading } = useQuery<CourseWithProgress[]>({
    queryKey: ["/api/user/courses"],
  });

  // Filter courses based on search term
  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Completed courses
  const completedCourses = filteredCourses?.filter(course => course.completed);

  // In-progress courses
  const inProgressCourses = filteredCourses?.filter(course => !course.completed);

  const renderCourseCard = (course: CourseWithProgress) => (
    <Card
      key={course.id}
      className="overflow-hidden transition-all duration-200 hover:shadow-md"
    >
      <div className="relative h-40 bg-gradient-to-r from-cyan-700 to-blue-500">
        {course.imageUrl && (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        )}
        {course.completed && (
          <div className="absolute top-4 right-4 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Completed
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{course.title}</h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span className="font-medium">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2" />
          <p className="mt-2 text-xs text-slate-500">
            {course.completed
              ? "Course completed"
              : `Module ${course.currentModule} of ${course.totalModules}`}
          </p>
        </div>

        <div className="mt-4">
          <Link href={`/course/${course.id}`}>
            <Button className="w-full">
              {course.completed ? "Review Course" : "Continue Learning"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center p-12">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 mx-auto text-slate-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium">No courses found</h3>
      <p className="mt-1 text-slate-500">{message}</p>
      <div className="mt-6">
        <Link href="/courses">
          <Button>Browse Available Courses</Button>
        </Link>
      </div>
    </div>
  );

  const LoadingState = ({ count = 3 }: { count?: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-40" />
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-2 w-full mb-2" />
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Courses</h1>
            <p className="text-slate-500 mt-1">
              Track your progress and continue learning
            </p>
          </div>

          <Link href="/courses">
            <Button className="mt-4 sm:mt-0" variant="outline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Browse Courses
            </Button>
          </Link>
        </div>

        {(!isLoading && (!courses || courses.length === 0)) ? (
          <EmptyState message="You haven't enrolled in any courses yet." />
        ) : (
          <>
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Search your courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <Tabs defaultValue="in-progress" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All Courses</TabsTrigger>
              </TabsList>

              <TabsContent value="in-progress" className="mt-0">
                {isLoading ? (
                  <LoadingState />
                ) : inProgressCourses && inProgressCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inProgressCourses.map(renderCourseCard)}
                  </div>
                ) : (
                  <EmptyState 
                    message={
                      searchTerm 
                        ? `No in-progress courses matching "${searchTerm}"`
                        : "You don't have any courses in progress."
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0">
                {isLoading ? (
                  <LoadingState />
                ) : completedCourses && completedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedCourses.map(renderCourseCard)}
                  </div>
                ) : (
                  <EmptyState 
                    message={
                      searchTerm 
                        ? `No completed courses matching "${searchTerm}"`
                        : "You haven't completed any courses yet."
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-0">
                {isLoading ? (
                  <LoadingState />
                ) : filteredCourses && filteredCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(renderCourseCard)}
                  </div>
                ) : (
                  <EmptyState 
                    message={
                      searchTerm 
                        ? `No courses matching "${searchTerm}"`
                        : "You haven't enrolled in any courses yet."
                    }
                  />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}