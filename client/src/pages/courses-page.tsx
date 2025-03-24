import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Course } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Fetch all courses
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Filter courses based on search term
  const filteredCourses = courses?.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCourseCard = (course: Course) => (
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
        {course.tag && (
          <div 
            className={`absolute top-4 right-4 rounded-full px-2 py-1 text-xs font-medium ${
              course.tagColor === 'primary' 
                ? 'bg-primary-100 text-primary-800' 
                : course.tagColor === 'secondary' 
                  ? 'bg-secondary-100 text-secondary-800' 
                  : 'bg-green-100 text-green-800'
            }`}
          >
            {course.tag}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{course.title}</h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="ml-1 text-sm font-medium">{course.rating}</span>
            <span className="ml-1 text-xs text-slate-400">({course.reviewCount} reviews)</span>
          </div>
          <span className="text-xs text-slate-500">{course.duration}</span>
        </div>
        
        <div className="mt-4">
          <Link href={`/course/${course.id}`}>
            <Button className="w-full">View Course</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Available Courses</h1>
          <p className="text-slate-500 mt-1">
            Browse through our quality engineering courses
          </p>
        </div>
        
        {user?.isAdmin && (
          <Link href="/settings?tab=courses">
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
              Manage Courses
            </Button>
          </Link>
        )}
      </div>
      
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-40" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-1/3 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(renderCourseCard)}
            </div>
          ) : (
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
              <p className="mt-1 text-slate-500">
                {searchTerm ? `No courses matching "${searchTerm}"` : "There are no courses available at the moment."}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-40" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-1/3 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses
                ?.filter(course => course.tag === "Popular")
                .map(renderCourseCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-40" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-1/3 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses
                ?.filter(course => course.tag === "New")
                .map(renderCourseCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}