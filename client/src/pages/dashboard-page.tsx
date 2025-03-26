import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import CourseCard from "@/components/courses/course-card";
import CourseProgress from "@/components/courses/course-progress";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Course } from "@shared/schema";

interface CourseWithProgress extends Course {
  progress: number;
  completed: boolean;
  currentModule?: number;
  totalModules?: number;
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    select: (data) => data || [],
  });

  const { data: userCourses, isLoading: isLoadingUserCourses } = useQuery<CourseWithProgress[]>({
    queryKey: ["/api/user/courses"],
    select: (data) => data || [],
    // Refetch every 2 seconds when the window is focused
    // This ensures dashboard updates even if cache invalidation didn't work
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
  });
  
  // Filter courses based on search query
  const filteredCourses = courses?.filter((course: Course) => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get in-progress course
  const inProgressCourse = userCourses?.find((course: CourseWithProgress) => course.progress > 0 && course.progress < 100);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search courses..."
                  className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bg-card shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-card-foreground mb-4">Your Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-foreground">Completed Courses</h3>
                        <p className="text-3xl font-semibold text-foreground">
                          {isLoadingUserCourses ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            userCourses?.filter((course: CourseWithProgress) => course.progress === 100).length || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-orange-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-foreground">In Progress</h3>
                        <p className="text-3xl font-semibold text-foreground">
                          {isLoadingUserCourses ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            userCourses?.filter((course: CourseWithProgress) => course.progress > 0 && course.progress < 100).length || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-secondary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 21v-2a4 4 0 0 1 4-4h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-8a4 4 0 0 0-4 4v2"></path>
                            <polyline points="15 8 12 11 15 14"></polyline>
                            <path d="M8 9v6"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-foreground">Certificates Earned</h3>
                        <p className="text-3xl font-semibold text-foreground">
                          {isLoadingUserCourses ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            userCourses?.filter((course: CourseWithProgress) => course.completed).length || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Courses */}
            <h2 className="text-xl font-medium text-foreground mb-4">Recommended Courses</h2>
            {isLoadingCourses ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}

            {/* Continue Learning */}
            {inProgressCourse && (
              <>
                <h2 className="text-xl font-medium text-foreground mb-4">Continue Learning</h2>
                <CourseProgress course={inProgressCourse} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
